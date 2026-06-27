package com.liquidglassmorphism

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Outline
import android.graphics.Paint
import android.graphics.Rect
import android.graphics.RenderEffect
import android.graphics.RenderNode
import android.graphics.RuntimeShader
import android.graphics.Shader
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import android.view.View
import android.view.ViewOutlineProvider
import android.view.ViewTreeObserver
import com.facebook.react.views.view.ReactViewGroup
import kotlin.math.max

/**
 * Android Liquid Glass surface — a faithful reproduction of the iOS 26
 * `UIGlassEffect` GPU pipeline, since Android has no equivalent system effect.
 *
 * iOS composites glass back-to-front each frame: capture backdrop → Gaussian
 * blur → vibrancy (saturation + luminance lift) → edge refraction → tint →
 * specular highlight → crisp content on top. We mirror that exactly:
 *
 *  1. **Capture** the hierarchy behind us into a downscaled [Bitmap] via a
 *     software canvas (we skip ourselves while capturing, so no feedback). This
 *     rasterizes immediately — unlike recording the live tree into a RenderNode,
 *     which keeps references back to our own node and stack-overflows HWUI.
 *  2. Draw that bitmap into a hardware [RenderNode] (a plain bitmap, no tree
 *     reference) and attach a [RenderEffect] chain: Gaussian **blur** →
 *  3. **Material shader** (AGSL, API 33+): vibrancy + refraction + tint +
 *     specular — the same per-pixel work iOS does.
 *  4. React children draw crisply on top (they're our ViewGroup children).
 *
 * Degrades gracefully: API 31–32 → blur + Canvas tint/specular; < API 31 →
 * translucent tint + rim only.
 */
class LiquidGlassmorphismView(context: Context) : ReactViewGroup(context),
  ViewTreeObserver.OnPreDrawListener, SensorEventListener {

  // --- Props ---
  private var variantClear = false
  private var intensity = 60
  private var tintColor: Int? = null
  private var interactive = false
  private var refractionEnabled = false
  private var cornerRadiusPx = 0f

  private val density = resources.displayMetrics.density

  // --- Backdrop capture (software bitmap → GPU effect) ---
  private var captured: Bitmap? = null
  private var captureCanvas: Canvas? = null
  private var isCapturing = false
  private var shaderActive = false
  private val locThis = IntArray(2)
  private val locRoot = IntArray(2)
  private val effectNode = if (supportsBlur()) RenderNode("liquidGlass") else null
  private val srcRect = Rect()
  private val dstRect = Rect()

  // Downscale for the captured backdrop: cheaper to draw and pre-softens the
  // blur. 3 keeps enough detail for vibrancy to read (6 looked muddy).
  private val captureScale = 3

  // Compiled once and reused; recompiling per frame would stutter. Null on
  // < API 33 or if the AGSL fails to compile (→ Canvas fallback).
  private val glassShader: RuntimeShader? = try {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) RuntimeShader(GLASS_AGSL) else null
  } catch (_: Throwable) {
    null
  }

  // --- Canvas fallback paints (used only when the shader isn't available) ---
  private val frostPaint = Paint(Paint.ANTI_ALIAS_FLAG)
  private val tintPaint = Paint(Paint.ANTI_ALIAS_FLAG)
  private val specularPaint = Paint(Paint.ANTI_ALIAS_FLAG)
  private val rimPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.STROKE }

  // --- Gyroscope tilt ---
  private var sensorManager: SensorManager? = null
  private var tiltX = 0f
  private var tiltY = 0f

  init {
    setWillNotDraw(false)
    clipToOutline = true
    outlineProvider = object : ViewOutlineProvider() {
      override fun getOutline(view: View, outline: Outline) {
        outline.setRoundRect(0, 0, view.width, view.height, cornerRadiusPx)
      }
    }
    refreshPaints()
  }

  // ---- Props API (called by the ViewManager) ----

  fun setVariantClear(clear: Boolean) {
    if (variantClear != clear) { variantClear = clear; refreshPaints(); invalidate() }
  }

  fun setIntensityValue(value: Int) {
    if (intensity != value) { intensity = value; invalidate() }
  }

  fun setTint(color: Int?) {
    if (tintColor != color) { tintColor = color; refreshPaints(); invalidate() }
  }

  fun setInteractiveValue(value: Boolean) {
    if (interactive == value) return
    interactive = value
    if (isAttachedToWindow) {
      if (interactive) registerSensor() else unregisterSensor()
    }
  }

  fun setRefractionValue(value: Boolean) {
    if (refractionEnabled != value) { refractionEnabled = value; invalidate() }
  }

  fun setCornerRadiusDp(dp: Int) {
    val px = dp * density
    if (cornerRadiusPx != px) {
      cornerRadiusPx = px
      invalidateOutline()
      invalidate()
    }
  }

  // ---- Lifecycle ----

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    viewTreeObserver.addOnPreDrawListener(this)
    if (interactive) registerSensor()
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    viewTreeObserver.removeOnPreDrawListener(this)
    unregisterSensor()
    captured?.recycle()
    captured = null
    captureCanvas = null
  }

  // ---- Backdrop capture (once per frame, before drawing) ----

  override fun onPreDraw(): Boolean {
    if (isCapturing || width == 0 || height == 0) return true
    captureBackdrop()
    return true
  }

  private fun captureBackdrop() {
    val w = width / captureScale
    val h = height / captureScale
    if (w <= 0 || h <= 0) return

    var bmp = captured
    if (bmp == null || bmp.width != w || bmp.height != h) {
      bmp?.recycle()
      bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
      captured = bmp
      captureCanvas = Canvas(bmp)
    }
    val canvas = captureCanvas ?: return
    val root = rootView ?: return

    bmp.eraseColor(Color.TRANSPARENT)
    getLocationInWindow(locThis)
    root.getLocationInWindow(locRoot)

    canvas.save()
    val scale = 1f / captureScale
    canvas.scale(scale, scale)
    canvas.translate(-(locThis[0] - locRoot[0]).toFloat(), -(locThis[1] - locRoot[1]).toFloat())
    // draw() short-circuits while capturing so we never record ourselves.
    isCapturing = true
    try {
      root.draw(canvas)
    } catch (_: Throwable) {
      // A child that refuses software draw → keep the previous backdrop.
    } finally {
      isCapturing = false
    }
    canvas.restore()
  }

  override fun draw(canvas: Canvas) {
    if (isCapturing) return
    super.draw(canvas)
  }

  // ---- Glass rendering (under children) ----

  override fun onDraw(canvas: Canvas) {
    val w = width.toFloat()
    val h = height.toFloat()
    if (w <= 0 || h <= 0) return

    val bmp = captured
    val node = effectNode
    if (bmp != null && !bmp.isRecycled && node != null && canvas.isHardwareAccelerated) {
      node.setPosition(0, 0, width, height)
      val rec = node.beginRecording()
      srcRect.set(0, 0, bmp.width, bmp.height)
      dstRect.set(0, 0, width, height)
      rec.drawBitmap(bmp, srcRect, dstRect, null)
      node.endRecording()
      node.setRenderEffect(buildEffect(width, height))
      canvas.drawRenderNode(node) // clipToOutline rounds it
    }

    if (!shaderActive) {
      canvas.drawRoundRect(0f, 0f, w, h, cornerRadiusPx, cornerRadiusPx, frostPaint)
      canvas.drawRoundRect(0f, 0f, w, h, cornerRadiusPx, cornerRadiusPx, tintPaint)
      drawCanvasSpecular(canvas, w, h)
    }

    val inset = rimPaint.strokeWidth / 2f
    canvas.drawRoundRect(inset, inset, w - inset, h - inset, cornerRadiusPx, cornerRadiusPx, rimPaint)
  }

  /** Blur → (optional) AGSL material chain. Mirrors the iOS compositing order. */
  private fun buildEffect(w: Int, h: Int): RenderEffect {
    val radius = GlassParams.blurRadiusPx(intensity, variantClear, density)
    val blur = RenderEffect.createBlurEffect(radius, radius, Shader.TileMode.CLAMP)

    val shader = glassShader
    if (shader == null) {
      shaderActive = false
      return blur
    }
    return try {
      shader.setFloatUniform("iResolution", w.toFloat(), h.toFloat())
      shader.setFloatUniform("iCorner", cornerRadiusPx)
      shader.setFloatUniform("iRefract", if (refractionEnabled) (if (variantClear) 0.7f else 1f) else 0f)
      shader.setFloatUniform("iSat", if (variantClear) 1.2f else 1.25f)
      shader.setFloatUniform("iLift", GlassParams.frostFloorAlpha(variantClear))
      shader.setFloatUniform("iSpecular", GlassParams.specularAlpha(variantClear))
      shader.setFloatUniform("iTilt", tiltX, tiltY)
      setTintUniform(shader)
      val material = RenderEffect.createRuntimeShaderEffect(shader, "content")
      shaderActive = true
      RenderEffect.createChainEffect(material, blur)
    } catch (_: Throwable) {
      shaderActive = false
      blur
    }
  }

  private fun setTintUniform(shader: RuntimeShader) {
    val c = GlassParams.resolveTintArgb(tintColor, variantClear)
    shader.setFloatUniform(
      "iTint",
      Color.red(c) / 255f,
      Color.green(c) / 255f,
      Color.blue(c) / 255f,
      Color.alpha(c) / 255f
    )
  }

  private fun drawCanvasSpecular(canvas: Canvas, w: Float, h: Float) {
    val shiftX = tiltX * w * 0.25f
    val shiftY = tiltY * h * 0.25f
    val gradient = LinearGradient(
      shiftX, shiftY, w * 0.5f + shiftX, h * 0.5f + shiftY,
      intArrayOf(specularPaint.color, Color.TRANSPARENT),
      floatArrayOf(0f, 0.55f),
      Shader.TileMode.CLAMP
    )
    specularPaint.shader = gradient
    canvas.drawRoundRect(0f, 0f, w, h, cornerRadiusPx, cornerRadiusPx, specularPaint)
    specularPaint.shader = null
  }

  private fun refreshPaints() {
    val frostA = (GlassParams.frostFloorAlpha(variantClear) * 255).toInt()
    frostPaint.color = Color.argb(frostA, 255, 255, 255)
    tintPaint.color = GlassParams.resolveTintArgb(tintColor, variantClear)
    val specA = (GlassParams.specularAlpha(variantClear) * 255).toInt()
    specularPaint.color = Color.argb(specA, 255, 255, 255)
    rimPaint.color = Color.argb(if (variantClear) 56 else 82, 255, 255, 255)
    rimPaint.strokeWidth = max(1f, density)
  }

  // ---- Gyroscope ----

  private fun registerSensor() {
    val sm = context.getSystemService(Context.SENSOR_SERVICE) as? SensorManager ?: return
    sensorManager = sm
    val sensor = sm.getDefaultSensor(Sensor.TYPE_GRAVITY)
      ?: sm.getDefaultSensor(Sensor.TYPE_ACCELEROMETER) ?: return
    sm.registerListener(this, sensor, SensorManager.SENSOR_DELAY_GAME)
  }

  private fun unregisterSensor() {
    sensorManager?.unregisterListener(this)
    sensorManager = null
  }

  override fun onSensorChanged(event: SensorEvent) {
    val nx = (event.values.getOrElse(0) { 0f } / 9.81f).coerceIn(-1f, 1f)
    val ny = (event.values.getOrElse(1) { 0f } / 9.81f).coerceIn(-1f, 1f)
    tiltX += (nx - tiltX) * 0.12f
    tiltY += (ny - tiltY) * 0.12f
    invalidate()
  }

  override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}

  companion object {
    private fun supportsBlur(): Boolean = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S

    // Physically-based glass, per pixel. Apple documents the behavior as
    // "blur + depth-based refraction + specular + lensing"; we implement the
    // optics that produce it. The shape is treated as a beveled glass slab:
    // flat on top, curving down at the rounded edges. We derive the surface
    // normal from the SDF, refract the (blurred) backdrop THROUGH that normal
    // (Snell), disperse R/G/B slightly (chromatic aberration), then add a
    // Fresnel rim + a tilt-driven specular highlight, over a frosted material.
    // `content` is the blurred backdrop fed in by the RenderEffect chain.
    private const val GLASS_AGSL = """
      uniform shader content;
      uniform float2 iResolution;
      uniform float iCorner;
      uniform float iRefract;
      uniform float iSat;
      uniform float iLift;
      uniform float iSpecular;
      uniform float2 iTilt;
      uniform half4 iTint;

      float sdRoundRect(float2 p, float2 b, float r) {
        float2 q = abs(p) - b + r;
        return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
      }

      half4 main(float2 coord) {
        float2 b = iResolution * 0.5;
        float2 p = coord - b;
        float d = sdRoundRect(p, b, iCorner);

        // Surface gradient (points toward the nearest edge) via finite diffs.
        float e = 1.0;
        float gx = sdRoundRect(p + float2(e, 0.0), b, iCorner) - sdRoundRect(p - float2(e, 0.0), b, iCorner);
        float gy = sdRoundRect(p + float2(0.0, e), b, iCorner) - sdRoundRect(p - float2(0.0, e), b, iCorner);
        float2 grad = normalize(float2(gx, gy) + float2(0.0001, 0.0001));

        // Beveled height field: flat interior, curving down over `bevel` px at
        // the edge. slope: 0 in the centre → 1 right at the rim.
        float bevel = max(10.0, min(iCorner, 30.0));
        float t = clamp(-d / bevel, 0.0, 1.0);
        float slope = (1.0 - t) * (1.0 - t);

        // 3D surface normal of the glass.
        float3 N = normalize(float3(grad * slope, 1.0 - 0.6 * slope));

        // Refraction: bend the backdrop sample along the normal (∝ thickness).
        float2 off = N.xy * bevel * 1.5 * iRefract;
        // Chromatic dispersion: split RGB sample offsets at the edge.
        float2 ca = N.xy * slope * 3.0 * iRefract;
        float2 base = coord + off;
        half3 src;
        src.r = content.eval(clamp(base + ca, float2(0.0), iResolution - 1.0)).r;
        src.g = content.eval(clamp(base,      float2(0.0), iResolution - 1.0)).g;
        src.b = content.eval(clamp(base - ca, float2(0.0), iResolution - 1.0)).b;

        // Frosted material: saturation boost + luminance lift.
        float luma = dot(src, half3(0.2126, 0.7152, 0.0722));
        half3 col = half3(luma) + (src - half3(luma)) * iSat;
        col = mix(col, half3(1.0), iLift);

        // Tint.
        col = mix(col, iTint.rgb, iTint.a);

        // Fresnel rim (bright all-around edge) + directional specular (tilt).
        float fres = pow(1.0 - N.z, 3.0);
        float3 L = normalize(float3(-0.4 + iTilt.x, -0.7 + iTilt.y, 0.8));
        float spec = pow(clamp(dot(N, L), 0.0, 1.0), 6.0);
        col = col + half3(fres * 0.5 + spec) * iSpecular;

        col = clamp(col, 0.0, 1.0);
        return half4(col, 1.0);
      }
    """
  }
}
