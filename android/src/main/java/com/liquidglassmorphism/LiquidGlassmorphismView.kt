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
import android.view.MotionEvent
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
  private var thickness = 1f
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
  private val captureScale = 2

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

  // --- Touch response (interactive) ---
  private var touchX = 0f
  private var touchY = 0f
  private var touchAmt = 0f      // eased current press strength, 0–1
  private var touchTarget = 0f   // 1 while pressed, 0 on release

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

  /** "Liquid volume" — scales refraction/lens depth. 0 = flat pane, 1 = default. */
  fun setThicknessValue(value: Float) {
    val v = value.coerceIn(0f, 2f)
    if (thickness != v) { thickness = v; invalidate() }
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

  // Observe touches to drive the interactive press bloom WITHOUT consuming them,
  // so React Native's own touch/press handling still works. Coordinates are in
  // this view's space, which matches the shader's pixel space.
  override fun dispatchTouchEvent(ev: MotionEvent): Boolean {
    if (interactive) {
      when (ev.actionMasked) {
        MotionEvent.ACTION_DOWN,
        MotionEvent.ACTION_POINTER_DOWN,
        MotionEvent.ACTION_MOVE -> {
          touchX = ev.x
          touchY = ev.y
          touchTarget = 1f
          invalidate()
        }
        MotionEvent.ACTION_UP,
        MotionEvent.ACTION_POINTER_UP,
        MotionEvent.ACTION_CANCEL -> {
          touchTarget = 0f
          invalidate()
        }
      }
    }
    return super.dispatchTouchEvent(ev)
  }

  // ---- Glass rendering (under children) ----

  override fun onDraw(canvas: Canvas) {
    val w = width.toFloat()
    val h = height.toFloat()
    if (w <= 0 || h <= 0) return

    // Ease the press strength toward its target and keep animating until settled.
    // The press effect is an OPTICAL magnification in the shader (below) — the
    // element keeps its size; only the glass lenses harder under the finger.
    if (interactive && kotlin.math.abs(touchTarget - touchAmt) > 0.003f) {
      touchAmt += (touchTarget - touchAmt) * 0.2f
      postInvalidateOnAnimation()
    }

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
      // Lensing is intrinsic to glass (always on); the `refraction` prop only
      // dials it up. This is what makes the backdrop bend around the edges.
      shader.setFloatUniform("iLens", GlassParams.lensStrengthPx(variantClear, refractionEnabled, density) * thickness)
      shader.setFloatUniform("iSat", if (variantClear) 1.55f else 1.3f)
      shader.setFloatUniform("iLift", GlassParams.frostFloorAlpha(variantClear))
      shader.setFloatUniform("iAdapt", GlassParams.adaptiveLift(variantClear))
      shader.setFloatUniform("iSpecular", GlassParams.specularAlpha(variantClear))
      // Broad glassy face reflection. Kept subtle on clear — a big milky sheen
      // band is exactly what makes clear glass read as frosted rather than clear.
      shader.setFloatUniform("iSheen", if (variantClear) 0.07f else 0.10f)
      shader.setFloatUniform("iTilt", tiltX, tiltY)
      shader.setFloatUniform("iTouch", touchX, touchY)
      shader.setFloatUniform("iTouchAmt", if (interactive) touchAmt else 0f)
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

    // Refractive glass lozenge, per pixel. This is a LENS, not a blur panel —
    // the defining difference between iOS 26 Liquid Glass and old frosted
    // "glassmorphism". We treat the view as a rounded-rect slab of glass with a
    // domed edge: nearly flat (clear) in the centre, curving down steeply at the
    // rounded rim. From the SDF we build that lens profile, tilt the surface
    // normal along it, and REFRACT the backdrop through it — displacing the
    // sample hard at the edges so the content behind visibly bends and magnifies
    // around the rim (like the edge of a water droplet), while the centre stays
    // clear. RGB are split at the rim (prismatic dispersion), then a thin
    // adaptive frost + vibrant tint + Fresnel rim + tilt specular finish it.
    // `content` is a LIGHTLY-frosted backdrop (kept crisp enough to refract).
    private const val GLASS_AGSL = """
      uniform shader content;
      uniform float2 iResolution;
      uniform float iCorner;
      uniform float iLens;
      uniform float iSat;
      uniform float iLift;
      uniform float iAdapt;
      uniform float iSpecular;
      uniform float iSheen;
      uniform float2 iTilt;
      uniform half4 iTint;
      uniform float2 iTouch;
      uniform float iTouchAmt;

      float sdRoundRect(float2 p, float2 b, float r) {
        float2 q = abs(p) - b + r;
        return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
      }

      half4 main(float2 coord) {
        float2 b = iResolution * 0.5;
        float2 p = coord - b;
        float d = sdRoundRect(p, b, iCorner);           // <0 inside

        // Outward surface gradient (points to the nearest edge) via finite diffs.
        float e = 1.0;
        float gx = sdRoundRect(p + float2(e, 0.0), b, iCorner) - sdRoundRect(p - float2(e, 0.0), b, iCorner);
        float gy = sdRoundRect(p + float2(0.0, e), b, iCorner) - sdRoundRect(p - float2(0.0, e), b, iCorner);
        float2 g = float2(gx, gy);
        float gmag = length(g);
        float2 n2 = g / (gmag + 1e-5);

        // The SDF gradient collapses along the shape's medial axis (the ridge
        // equidistant from two edges). On a short/pill shape the top and bottom
        // lens rings meet there and the normal flips, producing a hard seam
        // across the middle. Use the gradient magnitude as confidence and fade
        // the lens to zero at that ridge → flat clear glass in the centre, no
        // seam. In clear regions gmag ≈ 2e (=2 here); it drops toward the axis.
        float axisFade = smoothstep(0.3, 1.6, gmag);

        // Lens profile. `rim` ramps 0 (interior) → 1 (at the very edge) across a
        // ring `lensW` px wide. `bend` is a steep power of it, so almost all the
        // refraction happens in the outer ring — the centre stays clear glass.
        float lensW = max(28.0, iCorner * 1.4);
        float rim = 1.0 - clamp(-d / lensW, 0.0, 1.0);
        float bend = rim * rim * axisFade;

        // Refraction: pull the sample INWARD along the surface normal near the
        // edge. Because we sample from further inside, the content behind the
        // rim is magnified outward and appears to wrap the edge — the signature
        // Liquid Glass lensing. iLens is the edge displacement in pixels.
        // Interactive touch magnifier: locally zoom the backdrop TOWARD the
        // finger, so the glass optically magnifies under the press while the
        // element keeps its size (iOS presses lens harder, they don't resize).
        // Zero at the exact centre (stable focal point), peaking in a ring
        // around it, fading out with distance.
        float2 td = coord - iTouch;
        float tmr = min(iResolution.x, iResolution.y) * 0.9;
        float tFall = exp(-dot(td, td) / (tmr * tmr));
        float2 magCoord = coord - td * (iTouchAmt * tFall * 0.30);

        // Edge reflection: a thin, STEEP lens band at the very rim that folds
        // the sample back on itself, so content near the edge appears mirrored —
        // the faint inverted echo iOS shows at the top & bottom of a glass pill.
        // Only the outer `reflW` px are affected, so the readable centre stays
        // flat; `axisFade` keeps it off the medial-axis (no seam). Scales with
        // iLens so a flat pane (thickness 0) has no reflection.
        float reflW = max(14.0, min(b.x, b.y) * 0.4);
        float edgeBand = 1.0 - clamp(-d / reflW, 0.0, 1.0);
        float reflMask = edgeBand * edgeBand * edgeBand * axisFade;
        float2 reflDisp = n2 * reflMask * (iLens * 3.0);

        float2 disp = n2 * bend * iLens;
        float2 uv = magCoord - disp - reflDisp;

        // Chromatic dispersion at the rim: split R/G/B along the normal. Kept
        // VERY subtle — iOS UI glass shows almost no prismatic rainbow; a large
        // split reads as an artefact, not glass.
        float2 ca = n2 * bend * iLens * 0.018;
        half3 src;
        src.r = content.eval(clamp(uv + ca, float2(0.0), iResolution - 1.0)).r;
        src.g = content.eval(clamp(uv,      float2(0.0), iResolution - 1.0)).g;
        src.b = content.eval(clamp(uv - ca, float2(0.0), iResolution - 1.0)).b;

        // Vibrancy — glass over-saturates what it transmits.
        float luma = dot(src, half3(0.2126, 0.7152, 0.0722));
        half3 col = half3(luma) + (src - half3(luma)) * iSat;

        // Thin adaptive frost: see-through, lifting only dark backdrop toward a
        // neutral frost so text stays legible. Never a milky fill.
        float adapt = clamp(iLift + (1.0 - luma) * iAdapt, 0.0, 0.5);
        col = mix(col, half3(1.0), adapt);

        // Vibrant coloured tint (deep, not pastel).
        col = mix(col, iTint.rgb, clamp(iTint.a * 1.5, 0.0, 0.88));

        // 3D normal of the surface for lighting. Kept fairly FLAT (a glass
        // sheet, not a bubble) — iOS Liquid Glass is a flat pane; the edge
        // lensing does the work, not a domed bulge. Only a gentle rim tilt.
        float3 N = normalize(float3(n2 * bend * 0.8, 1.0 - 0.42 * bend));

        // Broad diagonal sheen band (tilt-driven) across the glass face.
        float2 uvn = coord / iResolution;
        float diag = (uvn.x + uvn.y) * 0.5;
        float sheen = exp(-pow((diag - 0.35 - iTilt.x * 0.15) * 3.0, 2.0)) * iSheen;

        // Clean, EVEN bright rim outline (iOS-style): a thin bright band traced
        // at the very edge, independent of lighting so it never clumps into
        // blobs the way a Fresnel/specular term does. This is the crisp 1px
        // glass edge iOS draws around every element.
        float rimLine = 1.0 - smoothstep(0.0, 3.0, -d);

        // Gentle Fresnel + a small moving specular hotspot — kept subtle so the
        // rim reads as a clean outline, not a glossy bubble.
        float fres = pow(1.0 - N.z, 3.0);
        float3 L = normalize(float3(-0.5 + iTilt.x * 1.5, -0.7 + iTilt.y * 1.5, 0.8));
        float spec = pow(clamp(dot(N, L), 0.0, 1.0), 10.0);

        // Soft inner shadow on the edge opposite the light → real depth.
        float2 lightDir = normalize(float2(-0.6 + iTilt.x, -0.8 + iTilt.y));
        float facing = clamp(dot(n2, lightDir), 0.0, 1.0);
        float edgeShade = rim * rim * (1.0 - facing) * 0.12;

        // Tint the highlights toward the glass colour so a coloured tint isn't
        // washed to grey by white specular / rim / sheen. iOS keeps tinted glass
        // saturated, and real coloured glass has coloured highlights. Untinted
        // glass keeps white highlights (its default tint IS white).
        half3 hi = mix(half3(1.0), iTint.rgb, iTint.a * 0.6);
        col = col + hi * (sheen + rimLine * 0.42 + (fres * 0.18 + spec * 0.6) * iSpecular)
                  - half3(edgeShade);

        // Interactive touch: a soft radial bloom under the finger — iOS glass
        // brightens and "flexes" where you press. Animated in/out by iTouchAmt.
        float2 tp = coord - iTouch;
        float tr = min(iResolution.x, iResolution.y);
        float touch = exp(-dot(tp, tp) / (tr * tr)) * iTouchAmt;
        col = col + hi * (touch * 0.2);

        col = clamp(col, 0.0, 1.0);
        return half4(col, 1.0);
      }
    """
  }
}
