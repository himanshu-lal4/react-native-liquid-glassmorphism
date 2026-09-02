package com.liquidglassmorphism

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapShader
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Matrix
import android.graphics.Outline
import android.graphics.Paint
import android.graphics.Path
import android.graphics.Rect
import android.graphics.RectF
import android.graphics.RenderEffect
import android.graphics.RenderNode
import android.graphics.RuntimeShader
import android.graphics.Shader
import androidx.core.graphics.PathParser
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.ViewOutlineProvider
import android.view.ViewTreeObserver
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.BackgroundStyleApplicator
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.style.BorderRadiusProp
import com.facebook.react.uimanager.events.Event
import com.facebook.react.views.view.ReactViewGroup
import kotlin.math.ceil
import kotlin.math.max
import kotlin.math.min

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
open class LiquidGlassmorphismView(context: Context) : ReactViewGroup(context),
  ViewTreeObserver.OnPreDrawListener, SensorEventListener {

  // --- Props ---
  private var variantClear = false
  private var intensity = 60
  // Explicit blur radius in dp. Negative means "derive it from `intensity`",
  // which is the default and what every existing app gets.
  private var blurRadiusDp = GlassParams.UNSET_BLUR_DP
  private var tintColor: Int? = null
  private var interactive = false
  // Gyro/accelerometer specular is now its own toggle (fix #3), decoupled from
  // `interactive` (touch). Off by default: no always-on motion sensor unless the
  // integrator explicitly opts in.
  private var tilt = false
  private var refractionEnabled = false
  private var thickness = 1f
  private var cornerRadiusPx = 0f

  /**
   * The corner radius actually usable at this size.
   *
   * A radius larger than half the shorter side is not a rounder rectangle, it
   * is a malformed one: `Outline.setRoundRect` rejects it, and `sdRoundRect`
   * computes `length(max(q,0)) - r` as POSITIVE everywhere, so the whole view
   * reads as OUTSIDE the glass and blows out to a flat fill. `borderRadius:
   * 999` — the ordinary way to ask for a pill — hit exactly that.
   *
   * Half the shorter side IS the pill, so clamping loses nothing.
   */
  /** The clamped corner radius, exposed so a container can merge our shape. */
  fun effectiveCornerRadiusPx(w: Int, h: Int): Float = cornerFor(w, h)

  private fun cornerFor(w: Int, h: Int): Float =
    GlassParams.effectiveCornerPx(cornerRadiusPx, w, h)
  // Edge-reflection band strength (#5), 0 (off) → 1 (default). Independent of
  // `thickness` so the upside-down rim echo can be calmed over text.
  private var edgeReflectionStrength = 1f
  // Look-shaping uniforms (#45). All default to "no change", so an untouched
  // view renders exactly as before and the shader branches stay cold.
  private var iridescence = 0f
  private var grain = 0f
  private var lightAngle = 0f
  private var specularSharpness = 1f
  private var saturation = 1f
  private var brightness = 1f
  private var magnification = 1f
  // Window glass. Chosen as the default because it reproduces the tuned lens
  // exactly, so adding the prop changed nothing for existing views.
  private var ior = 1.5f
  // Directional rim: 0 keeps the even outline iOS draws around every element;
  // above 0 the rim concentrates on the edges facing and opposing the light,
  // `pow(|n·L|, falloff)`, so a pill glints top-left and bottom-right and goes
  // quiet along its sides. Off by default — the even outline is the measured
  // iOS look; this is the knob for a more sculpted highlight.
  private var rimFalloff = 0f
  // Extra chromatic dispersion at the rim, 0–1. The material always splits RGB
  // by a hair (0.018·lens); this scales that up to a visible spectral fringe
  // and switches the sampling to seven spectral taps so it reads as a rainbow
  // rather than a red/blue ghost.
  private var dispersion = 0f

  // Frame-timing HUD (#47). `frameStatsInterval` is a PERMISSION, not a switch:
  // at 0 (the default) nothing is timed, accumulated or dispatched at all, so a
  // shipped app pays literally nothing for this existing.
  private var frameStatsInterval = 0
  private var statsFrames = 0
  private var statsWindowStartNs = 0L
  private var statsCaptureNs = 0L
  private var statsShaderNs = 0L
  private var statsTotalNs = 0L
  private var statsMaxTotalNs = 0L
  // Carries the capture cost from onPreDraw into the draw pass that consumes it.
  private var statsPendingCaptureNs = 0L
  // Legibility floor (#2), 0 → 1: an adaptive surface drawn UNDER the foreground
  // children so chrome (icons/labels) stays readable over clear glass.
  private var legibilityFloor = 0f
  // Composition primitives: switch the glass's decorative layers off so the
  // same view can serve as a plain blur pane, a scrim, or a modal backdrop.
  private var rimEnabled = true
  private var specularEnabled = true
  private var dim = 0f

  // Suspend the backdrop capture without unmounting. The glass holds its last
  // frame; only the per-frame `root.draw()` into our bitmap stops.
  private var pausedProp = false

  // Android's own answer to "is this view actually on screen", accounting for
  // the view, every ancestor, and the window — so it covers a pushed navigation
  // screen, an inactive tab, and the app being backgrounded, all at once.
  private var aggregatedVisible = true

  /** Capture work is skipped when the view is paused or not actually visible. */
  private val captureSuspended: Boolean
    get() = pausedProp || !aggregatedVisible

  // --- Custom shape (arbitrary SVG silhouette) ---
  private var shapePathData: String = ""
  private var shapeVBWidth = 0f
  private var shapeVBHeight = 0f
  // #49 — an optional second body, smooth-min merged with the first so the two
  // cling and fuse as they approach.
  private var secondaryShapePathData: String = ""
  private var shapeSmoothing = 0f

  // #Container — analytic multi-body merge. Each body is a rounded rect in this
  // view's pixel space (cx, cy, halfW, halfH) with a matching corner radius.
  // Folded with smooth-min IN THE SHADER, so a body moving costs a uniform
  // upload rather than a distance-field rebuild — which is the whole reason
  // this exists alongside `secondaryShape`.
  private var bodyCount = 0
  private val bodyRects = FloatArray(MAX_BODIES * 4)
  private val bodyRadii = FloatArray(MAX_BODIES)
  private var mergeSpacingPx = 0f
  /** Set by a container on its children: draw content, but no glass. */
  private var glassSuppressed = false
  // The path scaled into this view's pixel space (null = plain rounded rect).
  private var scaledShapePath: Path? = null
  // SDF texture of the silhouette, bound to the shader as `uniform shader sdf`.
  private var sdfInput: BitmapShader? = null
  private var sdfBitmap: Bitmap? = null
  // Full-res anti-aliased coverage — the shader's silhouette alpha (crisp edge).
  private var maskInput: BitmapShader? = null
  private var maskBitmap: Bitmap? = null
  // CPU-computed surface normals of the field (see GlassSdf.Result.grad).
  private var gradInput: BitmapShader? = null
  private var gradBitmap: Bitmap? = null
  private var sdfRange = 1f
  // Rebuild the (moderately expensive) SDF only when the path or size changes.
  private var sdfKey = ""

  private val density = resources.displayMetrics.density

  // 1×1 stand-in so the shader's `sdf` input is always bound, even in the
  // analytic rounded-rect path where the SDF branch is never taken.
  private val dummyShader: BitmapShader by lazy {
    val b = Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888)
    b.eraseColor(Color.argb(255, 128, 128, 128))
    BitmapShader(b, Shader.TileMode.CLAMP, Shader.TileMode.CLAMP)
  }

  // --- Layer backdrop (GPU display list; see LiquidGlassBackdropView) ---
  // The nearest enclosing backdrop host, if any. While it is compositing, it
  // draws us itself, hands us the node to sample in [backdropBelow], and the
  // software capture below is skipped entirely.
  internal var backdropHost: LiquidGlassBackdropView? = null
  internal var backdropBelow: RenderNode? = null
  /**
   * Set by the host around its explicit draw of us. While the host is
   * compositing, that is the ONLY draw that renders anything: a draw reached
   * through the view tree (our own display list, or a parent glass's children)
   * would put a second copy of the glass on screen, sampling a stale backdrop.
   */
  internal var drawingFromHost = false
  private val hostMatrix = Matrix()
  private val hostInverse = Matrix()
  private val hostRect = RectF()
  // Our placement inside the host as of the last frame, to notice a move.
  private val placementNow = FloatArray(9)
  private val placementLast = FloatArray(9) { Float.NaN }

  /** True when this frame's glass should come from the host's display list. */
  private val layerMode: Boolean
    get() {
      val host = backdropHost ?: return false
      return host.layerActive && backdropBelow != null && effectNode != null
    }

  // --- Backdrop capture (software bitmap → GPU effect) ---
  // The backdrop is now owned per-ROOT and shared by every glass view under it
  // (#38). This view holds a reference and a sub-rectangle into it; it no
  // longer allocates or draws a bitmap of its own.
  private var shared: SharedBackdrop? = null
  private var sharedRoot: View? = null
  private val captured: Bitmap? get() = shared?.bitmap
  private var shaderActive = false
  // Dirty-tracking (fix #1): a cheap sampled hash of the last captured backdrop
  // plus a "have we ever drawn a good frame" flag. We only re-draw the glass
  // when the backdrop actually changed, instead of self-invalidating every
  // frame. This also self-heals a stale/black first capture (taken mid-layout):
  // the next real change re-captures and repaints, so it can't stick as a ghost
  // overlay the way the old unconditional path did.
  private var lastBackdropHash = 0
  private var haveGoodCapture = false
  // #6 (observability): report the rendered tier once, so QA can confirm from
  // logcat which path actually ran on a given device (agsl / blur / tint) —
  // "flat because fallback" vs "flat because misconfigured".
  private var reportedTier = false
  // Draws waited so far for the effect path to settle before reporting a tier.
  // See [emitPipelineReady] — the first draw usually precedes the first
  // backdrop capture, so `shaderActive` is not yet meaningful there.
  private var tierReportDeferrals = 0
  private val locThis = IntArray(2)
  private val locRoot = IntArray(2)
  private val effectNode = if (supportsBlur()) RenderNode("liquidGlass") else null
  // The layer path gets its OWN node. A display list recorded through the view
  // tree (ours, or a parent glass's children) may still hold a reference to
  // `effectNode` from a bitmap-path frame; if the host's explicit draw then
  // re-recorded that same node to reference the backdrop, the backdrop would
  // contain a node that draws the backdrop — a cycle HWUI walks until the
  // render thread overflows its stack. Two nodes make that impossible by
  // construction: nothing recorded through the tree ever references this one.
  private val layerNode = if (supportsBlur()) RenderNode("liquidGlassLayer") else null
  // The React children, recorded into their own node so they can be rounded
  // with an anti-aliased outline clip now that the view itself no longer clips.
  private val childrenNode =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) RenderNode("liquidGlassContent") else null
  private val effectOutline = Outline()
  private val contentOutline = Outline()
  private val srcRect = Rect()
  private val hashRect = Rect()
  private val dstRect = Rect()
  // Blur margin actually taken per side, in bitmap pixels (see paddedSrcRect).
  private val padRect = Rect()
  private val scratchPad = Rect()

  // Downscale for the captured backdrop: cheaper to draw and pre-softens the
  // blur. 2 keeps enough detail for vibrancy to read (larger factors looked muddy).
  private val captureScale = 2

  // Compiled once and reused; recompiling per frame would stutter. Null on
  // < API 33 or if the AGSL fails to compile (→ Canvas fallback).
  private val glassShader: RuntimeShader? = try {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) RuntimeShader(GLASS_AGSL) else null
  } catch (t: Throwable) {
    // The compiler's message names the line; without it a broken shader is
    // just "tier=blur" with nothing to go on.
    android.util.Log.w("LiquidGlass", "AGSL glass shader failed to compile: ${t.message}")
    null
  }

  // --- Canvas fallback paints (used only when the shader isn't available) ---
  private val frostPaint = Paint(Paint.ANTI_ALIAS_FLAG)
  private val tintPaint = Paint(Paint.ANTI_ALIAS_FLAG)
  private val specularPaint = Paint(Paint.ANTI_ALIAS_FLAG)
  private val rimPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.STROKE }
  // Legibility floor (#2) — a neutral veil under the foreground children.
  private val legibilityPaint = Paint(Paint.ANTI_ALIAS_FLAG)

  // --- Gyroscope tilt ---
  private var sensorManager: SensorManager? = null
  private var tiltX = 0f
  private var tiltY = 0f

  // --- Touch response (interactive) ---
  private var touchX = 0f
  private var touchY = 0f
  private var touchAmt = 0f      // eased current press strength, 0–1
  private var touchTarget = 0f   // 1 while pressed, 0 on release
  private var touchVel = 0f      // spring velocity for the press animation

  init {
    setWillNotDraw(false)
    // Rounding is done by RenderNode outlines (the effect node and the
    // children node, see onDraw/dispatchDraw) rather than by clipping the whole
    // view. A view-level clip also clips the background drawable, which is
    // where React Native paints a `boxShadow` — so an outset shadow was cut
    // off at the bounds and never showed. Below API 29 there is no public
    // RenderNode, so the view clip stays and the shadow stays clipped.
    clipToOutline = Build.VERSION.SDK_INT < Build.VERSION_CODES.Q
    outlineProvider = object : ViewOutlineProvider() {
      override fun getOutline(view: View, outline: Outline) {
        outline.setRoundRect(0, 0, view.width, view.height, cornerFor(view.width, view.height))
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

  fun setBlurRadiusDpValue(value: Float) {
    if (blurRadiusDp != value) { blurRadiusDp = value; invalidate() }
  }

  fun setTint(color: Int?) {
    if (tintColor != color) { tintColor = color; refreshPaints(); invalidate() }
  }

  fun setInteractiveValue(value: Boolean) {
    // Touch-magnify only now — the motion sensor is governed by `tilt` (#3).
    if (interactive == value) return
    interactive = value
    invalidate()
  }

  /** Gyro/accelerometer specular (#3). Registers the sensor only while on. */
  fun setTiltValue(value: Boolean) {
    if (tilt == value) return
    tilt = value
    if (isAttachedToWindow) {
      if (tilt) registerSensor() else unregisterSensor()
    }
    if (!tilt) {
      // Recenter the specular when tilt is switched off.
      tiltX = 0f
      tiltY = 0f
      invalidate()
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

  /** Edge-reflection strength (#5), 0 (off) → 1 (default), clamped. */
  fun setEdgeReflectionStrengthValue(value: Float) {
    val v = value.coerceIn(0f, 1f)
    if (edgeReflectionStrength != v) { edgeReflectionStrength = v; invalidate() }
  }

  /** Rim iridescence (#45), 0 (off) → 1, clamped. */
  fun setIridescenceValue(value: Float) {
    val v = value.coerceIn(0f, 1f)
    if (iridescence != v) { iridescence = v; invalidate() }
  }

  /** Film grain (#45), 0 (off) → 0.15, clamped. */
  fun setGrainValue(value: Float) {
    val v = value.coerceIn(0f, 0.15f)
    if (grain != v) { grain = v; invalidate() }
  }

  /** Light-direction rotation (#45), in radians. Unclamped — angles wrap. */
  fun setLightAngleValue(value: Float) {
    val v = if (value.isFinite()) value else 0f
    if (lightAngle != v) { lightAngle = v; invalidate() }
  }

  /** Specular exponent multiplier (#45); 1 is the default hotspot. */
  fun setSpecularSharpnessValue(value: Float) {
    val v = value.coerceIn(0.25f, 4f)
    if (specularSharpness != v) { specularSharpness = v; invalidate() }
  }

  /** Backdrop vibrancy multiplier (#45); 1 is the default over-saturation. */
  fun setSaturationValue(value: Float) {
    val v = value.coerceIn(0f, 2f)
    if (saturation != v) { saturation = v; invalidate() }
  }

  /** Backdrop luminance multiplier (#45); 1 is unchanged. */
  fun setBrightnessValue(value: Float) {
    val v = value.coerceIn(0.5f, 1.5f)
    if (brightness != v) { brightness = v; invalidate() }
  }

  /** Centre lens magnification (#45); 1 samples the backdrop 1:1. */
  fun setMagnificationValue(value: Float) {
    val v = value.coerceIn(0.5f, 2f)
    if (magnification != v) { magnification = v; invalidate() }
  }

  /** Index of refraction (#45); 1.5 is window glass and the default look. */
  fun setIorValue(value: Float) {
    val v = value.coerceIn(1f, 2.5f)
    if (ior != v) { ior = v; invalidate() }
  }

  /** Directional rim exponent; 0 (default) is the even outline. */
  fun setRimFalloffValue(value: Float) {
    val v = value.coerceIn(0f, 8f)
    if (rimFalloff != v) { rimFalloff = v; invalidate() }
  }

  /** Extra rim dispersion, 0 (default, a hair) → 1 (a visible spectral fringe). */
  fun setDispersionValue(value: Float) {
    val v = value.coerceIn(0f, 1f)
    if (dispersion != v) { dispersion = v; invalidate() }
  }

  /**
   * Frame-stats reporting window in ms (#47). 0 (default) disables it entirely.
   *
   * Changing it resets the window rather than folding old samples into a new
   * cadence, which would make the first report after a change meaningless.
   */
  fun setFrameStatsIntervalValue(value: Int) {
    val v = if (value > 0) value else 0
    if (frameStatsInterval == v) return
    frameStatsInterval = v
    resetFrameStats()
  }

  private fun resetFrameStats() {
    statsFrames = 0
    statsWindowStartNs = 0L
    statsCaptureNs = 0L
    statsShaderNs = 0L
    statsTotalNs = 0L
    statsMaxTotalNs = 0L
    statsPendingCaptureNs = 0L
  }

  /**
   * Fold one frame into the window, and emit if the window has elapsed.
   *
   * Averages within the window rather than sampling one frame in N, so a spike
   * between reports still shows up — in [statsMaxTotalNs], which is why the
   * payload carries a max alongside the mean.
   */
  private fun recordFrameStats(shaderNs: Long) {
    val now = System.nanoTime()
    if (statsWindowStartNs == 0L) statsWindowStartNs = now

    val total = statsPendingCaptureNs + shaderNs
    statsFrames++
    statsCaptureNs += statsPendingCaptureNs
    statsShaderNs += shaderNs
    statsTotalNs += total
    if (total > statsMaxTotalNs) statsMaxTotalNs = total
    statsPendingCaptureNs = 0L

    val elapsedNs = now - statsWindowStartNs
    if (elapsedNs < frameStatsInterval * 1_000_000L) return

    val frames = statsFrames
    val bmp = captured
    dispatch(
      GlassFrameStatsEvent(
        UIManagerHelper.getSurfaceId(this),
        id,
        frames * 1_000_000_000.0 / elapsedNs,
        statsTotalNs / frames / 1_000_000.0,
        statsMaxTotalNs / 1_000_000.0,
        statsCaptureNs / frames / 1_000_000.0,
        statsShaderNs / frames / 1_000_000.0,
        currentTier(),
        bmp?.width ?: 0,
        bmp?.height ?: 0
      )
    )
    resetFrameStats()
    statsWindowStartNs = now
  }

  /** Legibility floor (#2), 0 (off) → 1 (max), clamped. */
  fun setPausedValue(value: Boolean) {
    if (pausedProp == value) return
    pausedProp = value
    // Resuming has to force a fresh capture: whatever is behind the glass moved
    // while we were not looking, so the held frame is stale by definition.
    if (!captureSuspended) resumeCapture()
  }

  /** #49 — the second body's SVG path, in the same view-box as `shape`. */
  fun setSecondaryShapePathValue(value: String?) {
    val v = value ?: ""
    if (secondaryShapePathData != v) {
      secondaryShapePathData = v
      sdfKey = ""
      invalidate()
    }
  }

  /** #49 — smooth-min blend radius in dp. 0 is a hard union. */
  fun setShapeSmoothingValue(value: Float) {
    val v = (value * density).coerceAtLeast(0f)
    if (shapeSmoothing != v) {
      shapeSmoothing = v
      sdfKey = ""
      invalidate()
    }
  }

  /**
   * Replace the silhouette with N analytic rounded rects, smooth-min merged.
   *
   * Coordinates are this view's pixel space. Passing a count of 0 restores the
   * ordinary single-shape behaviour.
   */
  fun setMergedBodies(rects: FloatArray, radii: FloatArray, count: Int, spacingPx: Float) {
    val n = count.coerceIn(0, MAX_BODIES)
    var changed = bodyCount != n || mergeSpacingPx != spacingPx
    bodyCount = n
    mergeSpacingPx = spacingPx
    for (i in 0 until n * 4) {
      if (bodyRects[i] != rects[i]) { bodyRects[i] = rects[i]; changed = true }
    }
    for (i in 0 until n) {
      if (bodyRadii[i] != radii[i]) { bodyRadii[i] = radii[i]; changed = true }
    }
    if (changed) invalidate()
  }

  /**
   * Adopt another glass view's MATERIAL — everything about how the surface
   * looks, and nothing about where it is.
   *
   * A container draws the merged body itself and suppresses its children, so
   * without this the merged surface would render with the container's own
   * defaults and the children's `variant`, `tint` and `thickness` would be
   * silently discarded. Wrapping four `clear` lenses in a container turned
   * them all frosted, which is exactly the bug this prevents.
   *
   * Same-class private access, so the field list stays in one place: adding a
   * material prop above without adding it here is the failure mode to watch.
   */
  fun adoptMaterialFrom(src: LiquidGlassmorphismView) {
    var changed = false
    fun <T> take(cur: T, next: T, set: (T) -> Unit) {
      if (cur != next) { set(next); changed = true }
    }
    take(variantClear, src.variantClear) { variantClear = it }
    take(intensity, src.intensity) { intensity = it }
    take(blurRadiusDp, src.blurRadiusDp) { blurRadiusDp = it }
    take(tintColor, src.tintColor) { tintColor = it }
    take(thickness, src.thickness) { thickness = it }
    take(refractionEnabled, src.refractionEnabled) { refractionEnabled = it }
    take(rimEnabled, src.rimEnabled) { rimEnabled = it }
    take(specularEnabled, src.specularEnabled) { specularEnabled = it }
    take(dim, src.dim) { dim = it }
    take(edgeReflectionStrength, src.edgeReflectionStrength) { edgeReflectionStrength = it }
    take(legibilityFloor, src.legibilityFloor) { legibilityFloor = it }
    take(iridescence, src.iridescence) { iridescence = it }
    take(grain, src.grain) { grain = it }
    take(lightAngle, src.lightAngle) { lightAngle = it }
    take(specularSharpness, src.specularSharpness) { specularSharpness = it }
    take(saturation, src.saturation) { saturation = it }
    take(brightness, src.brightness) { brightness = it }
    take(magnification, src.magnification) { magnification = it }
    take(ior, src.ior) { ior = it }
    take(rimFalloff, src.rimFalloff) { rimFalloff = it }
    take(dispersion, src.dispersion) { dispersion = it }
    if (changed) {
      refreshPaints()
      invalidate()
    }
  }

  /** A container renders the merged glass; its children must not draw their own. */
  fun setGlassSuppressed(value: Boolean) {
    if (glassSuppressed != value) { glassSuppressed = value; invalidate() }
  }

  fun setRimValue(value: Boolean) {
    if (rimEnabled != value) { rimEnabled = value; refreshPaints(); invalidate() }
  }

  fun setSpecularValue(value: Boolean) {
    if (specularEnabled != value) { specularEnabled = value; invalidate() }
  }

  fun setDimValue(value: Float) {
    val v = value.coerceIn(0f, 1f)
    if (dim != v) { dim = v; invalidate() }
  }

  fun setLegibilityFloorValue(value: Float) {
    val v = value.coerceIn(0f, 1f)
    if (legibilityFloor != v) { legibilityFloor = v; invalidate() }
  }

  fun setCornerRadiusDp(dp: Int) {
    val px = dp * density
    // Hand the radius to React Native's background style too. The glass does
    // its own rounding, but RN's background drawable is where a `boxShadow`
    // style is painted, and without the radius that shadow is a sharp
    // rectangle under a rounded pane.
    BackgroundStyleApplicator.setBorderRadius(
      this,
      BorderRadiusProp.BORDER_RADIUS,
      LengthPercentage(dp.toFloat().coerceAtLeast(0f), LengthPercentageType.POINT)
    )
    if (cornerRadiusPx != px) {
      cornerRadiusPx = px
      invalidateOutline()
      invalidate()
    }
  }

  fun setShapePathData(value: String?) {
    val v = value ?: ""
    if (shapePathData != v) { shapePathData = v; onShapeInputChanged() }
  }

  fun setShapeViewBoxWidth(value: Float) {
    if (shapeVBWidth != value) { shapeVBWidth = value; onShapeInputChanged() }
  }

  fun setShapeViewBoxHeight(value: Float) {
    if (shapeVBHeight != value) { shapeVBHeight = value; onShapeInputChanged() }
  }

  private fun onShapeInputChanged() {
    // Force a rebuild on the next draw and flip outline clipping: the analytic
    // path rounds via the outline, a custom shape is shaped by the SDF alpha
    // (+ a path clip) instead, so hard outline-rounding must be off.
    sdfKey = ""
    val hasShape = shapePathData.isNotEmpty() && shapeVBWidth > 0f && shapeVBHeight > 0f
    clipToOutline = !hasShape
    if (!hasShape) {
      scaledShapePath = null
      sdfInput = null
      sdfBitmap?.recycle()
      sdfBitmap = null
      maskInput = null
      maskBitmap?.recycle()
      maskBitmap = null
      gradInput = null
      gradBitmap?.recycle()
      gradBitmap = null
    }
    invalidate()
  }

  /**
   * Rebuild the scaled path + SDF texture when the silhouette or the view size
   * changes. Cheap no-op on every other frame (keyed on path + size).
   */
  private fun ensureShape(w: Int, h: Int) {
    val hasShape = shapePathData.isNotEmpty() && shapeVBWidth > 0f && shapeVBHeight > 0f
    if (!hasShape || w <= 0 || h <= 0) return

    val key = "$shapePathData|$secondaryShapePathData|$shapeSmoothing@${w}x$h"
    if (key == sdfKey && scaledShapePath != null) return

    val path = try {
      PathParser.createPathFromPathData(shapePathData)
    } catch (_: Throwable) {
      null
    } ?: run {
      sdfKey = key
      emitError(
        GlassErrorEvent.INVALID_SHAPE,
        "The `shape` path could not be parsed, so the glass is drawing its " +
          "rounded rectangle instead. Elliptic arcs (A) are not supported — " +
          "express curves as béziers."
      )
      return
    }

    // Stretch the authored view-box onto the actual bounds (aspect-agnostic).
    val m = Matrix()
    m.setScale(w / shapeVBWidth, h / shapeVBHeight)
    path.transform(m)
    scaledShapePath = path

    if (glassShader == null) {
      // The silhouette still clips, but without the signed-distance field the
      // lens optics that make it read as glass are simply absent.
      emitError(
        GlassErrorEvent.PIPELINE_DEGRADED,
        "A custom `shape` needs the AGSL lens pipeline (API 33+); on API " +
          "${Build.VERSION.SDK_INT} the silhouette clips but renders as a " +
          "path-clipped frost with no refraction."
      )
    }

    val secondaryPath = if (secondaryShapePathData.isEmpty()) null else {
      val sp = try {
        PathParser.createPathFromPathData(secondaryShapePathData)
      } catch (_: Throwable) {
        emitError(
          GlassErrorEvent.INVALID_SHAPE,
          "The `secondaryShape` path could not be parsed, so only the primary " +
            "shape is drawn. Elliptic arcs (A) are not supported — express " +
            "curves as béziers."
        )
        null
      }
      sp?.also { it.transform(m) }
    }

    if (glassShader != null) {
      val result = GlassSdf.build(path, w, h, secondaryPath, shapeSmoothing)
      if (result != null) {
        sdfBitmap?.recycle()
        sdfBitmap = result.bitmap
        sdfRange = result.range
        val shader = BitmapShader(result.bitmap, Shader.TileMode.CLAMP, Shader.TileMode.CLAMP)
        // Stretch the (possibly downscaled) SDF texture over the full view, so
        // `sdf.eval(coord)` samples the right texel for a view-pixel coord. The
        // local matrix maps bitmap space → drawing space, hence view/bitmap.
        val lm = Matrix()
        lm.setScale(
          w.toFloat() / result.bitmap.width,
          h.toFloat() / result.bitmap.height
        )
        shader.setLocalMatrix(lm)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
          shader.filterMode = BitmapShader.FILTER_MODE_LINEAR
        }
        sdfInput = shader

        // Normal field: same stretch + linear filtering as the SDF.
        gradBitmap?.recycle()
        gradBitmap = result.grad
        val gShader = BitmapShader(result.grad, Shader.TileMode.CLAMP, Shader.TileMode.CLAMP)
        gShader.setLocalMatrix(lm)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
          gShader.filterMode = BitmapShader.FILTER_MODE_LINEAR
        }
        gradInput = gShader

        // Silhouette alpha from the full-res AA coverage.
        maskBitmap?.recycle()
        maskBitmap = result.mask
        val mShader = BitmapShader(result.mask, Shader.TileMode.CLAMP, Shader.TileMode.CLAMP)
        val mm = Matrix()
        mm.setScale(w.toFloat() / result.mask.width, h.toFloat() / result.mask.height)
        mShader.setLocalMatrix(mm)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
          mShader.filterMode = BitmapShader.FILTER_MODE_LINEAR
        }
        maskInput = mShader
      }
    }
    sdfKey = key
  }

  // ---- Lifecycle ----

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    // Join (or start) this root's shared backdrop. Ref-counted, so the bitmap
    // outlives individual views but not the last one.
    // Hand back any reference we are still holding before taking another.
    // Attach/detach is not guaranteed to alternate cleanly — a re-attach while
    // `rootView` is momentarily null used to skip the acquire but keep the old
    // handle, so the next detach released a second time. Measured as 342
    // releases against 336 acquires under churn, and every unmatched release
    // walks refCount toward zero, at which point the shared bitmap is disposed
    // while live views are still drawing from it.
    if (shared != null) {
      SharedBackdrop.release(sharedRoot, shared)
      shared = null
      sharedRoot = null
    }
    val root = rootView
    if (root != null) {
      sharedRoot = root
      shared = SharedBackdrop.acquire(root, captureScale)
    }
    backdropHost = findBackdropHost()
    viewTreeObserver.addOnPreDrawListener(this)
    if (tilt) registerSensor()
    maybeWarnNoChildren()
  }

  /** True (and remembers the new placement) if we moved inside the host. */
  private fun placementChanged(host: LiquidGlassBackdropView): Boolean {
    if (!computeHostTransform(host)) return false
    hostMatrix.getValues(placementNow)
    var changed = false
    for (i in 0 until 9) {
      if (placementNow[i] != placementLast[i]) { changed = true; break }
    }
    if (changed) System.arraycopy(placementNow, 0, placementLast, 0, 9)
    return changed
  }

  private fun findBackdropHost(): LiquidGlassBackdropView? {
    var p = parent
    while (p != null) {
      if (p is LiquidGlassBackdropView) return p
      p = p.parent
    }
    return null
  }

  /**
   * Repaints of the glass have to reach the host: in layer mode our pixels
   * live in the host's display list, not our own, so a plain invalidate would
   * re-record an empty node and change nothing on screen.
   */
  override fun invalidate() {
    super.invalidate()
    val host = backdropHost ?: return
    if (host.layerActive) host.invalidate()
  }

  /**
   * Our placement inside the backdrop host — every level's position, scroll
   * and transform — and its inverse. False if we are not inside one.
   */
  private fun computeHostTransform(host: LiquidGlassBackdropView): Boolean {
    hostMatrix.reset()
    var v: View = this
    val local = Matrix()
    while (v !== host) {
      val p = v.parent as? ViewGroup ?: return false
      local.set(v.matrix)
      local.postTranslate((v.left - p.scrollX).toFloat(), (v.top - p.scrollY).toFloat())
      hostMatrix.postConcat(local)
      v = p
    }
    return hostMatrix.invert(hostInverse)
  }

  /**
   * Android's aggregate visibility signal: false whenever this view, any
   * ancestor, or the window is not visible.
   *
   * That single callback covers a screen pushed on top of this one, an inactive
   * tab, and the app being backgrounded — all cases where the glass stays
   * mounted and would otherwise keep capturing a backdrop nobody can see.
   */
  override fun onVisibilityAggregated(isVisible: Boolean) {
    super.onVisibilityAggregated(isVisible)
    if (aggregatedVisible == isVisible) return
    aggregatedVisible = isVisible
    if (isVisible && !captureSuspended) resumeCapture()
    // The motion sensor is pure cost while off-screen: it cannot move a
    // specular highlight nobody is looking at.
    if (tilt) {
      if (isVisible) registerSensor() else unregisterSensor()
    }
  }

  /**
   * Drop the held frame and repaint from a fresh capture.
   *
   * Clearing [haveGoodCapture] is what forces [onPreDraw] to repaint even if the
   * backdrop hash happens to match the frame we froze on.
   */
  private fun resumeCapture() {
    haveGoodCapture = false
    lastBackdropHash = 0
    // The shared holder may already have "captured" this frame for a sibling
    // before we resumed; drop that so we get a genuinely fresh backdrop.
    shared?.invalidateFrame()
    postInvalidateOnAnimation()
  }

  // Dev warning (#8): touch/tilt effects are driven by this view's own
  // dispatchTouchEvent, so they're a silent no-op unless foreground content is
  // a CHILD of the glass (not a sibling overlay). Warn once so the footgun is
  // visible instead of costing debugging time.
  private var warnedNoChildren = false
  private fun maybeWarnNoChildren() {
    if (warnedNoChildren || childCount > 0) return
    if (interactive || tilt) {
      warnedNoChildren = true
      android.util.Log.w(
        "LiquidGlass",
        "interactive/tilt is set but the glass has no children — touch & tilt " +
          "effects are driven by the view's own touches, so they do nothing " +
          "unless foreground content is rendered as a CHILD of <LiquidGlassView>."
      )
    }
  }

  // ---- Events ----

  // Codes already reported for this view. A failure inside onDraw repeats every
  // frame, so without this the bridge would carry the same error at 60fps.
  private val reportedErrors = HashSet<String>()

  private fun dispatch(event: Event<*>) {
    val reactContext = context as? ReactContext ?: return
    UIManagerHelper
      .getEventDispatcherForReactTag(reactContext, id)
      ?.dispatchEvent(event)
  }

  /**
   * Report that the view is not doing what its props asked for.
   *
   * Always logged, whether or not JS attached a handler — the logcat line is
   * what makes this debuggable on a device with no debugger attached.
   */
  private fun emitError(code: String, message: String, fatal: Boolean = false) {
    if (!reportedErrors.add(code)) return
    android.util.Log.w("LiquidGlass", "$code: $message")
    dispatch(GlassErrorEvent(UIManagerHelper.getSurfaceId(this), id, code, message, fatal))
  }

  /**
   * Report the tier that actually rendered, once per view.
   *
   * Fires from [onDraw] for **every** tier, including the ones that never reach
   * the RenderNode path — a report that only arrives on capable devices is the
   * opposite of what this is for.
   */
  /** The tier this view is actually rendering right now. */
  private fun currentTier(): String = when {
    shaderActive -> "refraction"
    supportsBlur() -> "blur"
    else -> "tint"
  }

  private fun emitPipelineReady() {
    if (reportedTier) return

    // `shaderActive` is only assigned inside `buildEffect`, which is called from
    // the render-node branch of `onDraw` — and that branch needs a captured
    // backdrop. The FIRST draw almost never has one: the first `onPreDraw` bails
    // out while width/height are still 0, so nothing has been captured yet, the
    // branch is skipped, and `shaderActive` is still its initial `false`.
    //
    // Reporting there latched `blur` on devices that render `refraction` on
    // every subsequent frame, permanently — the report is the library's
    // observability contract, so it was lying about the one thing it exists to
    // answer, and it disagreed with `onFrameStats`, which computes the tier live.
    //
    // The caller already guarantees this is a hardware draw. Even so, the first
    // one can land before the first backdrop capture, so wait a few frames for
    // the effect path to run. Bounded, because a shader that genuinely never
    // applies must still report rather than going silent forever.
    if (
      !shaderActive &&
      glassShader != null &&
      tierReportDeferrals < MAX_TIER_REPORT_DEFERRALS
    ) {
      tierReportDeferrals++
      // Guarantee there IS a next draw. On a static screen the capture loop
      // settles and stops invalidating, so without this a deferred report could
      // wait for a frame that never comes.
      postInvalidateOnAnimation()
      return
    }

    reportedTier = true

    val tier = currentTier()
    val compiled = glassShader != null

    // Kept alongside the event: QA can confirm the tier from a device build
    // with no JS handler wired up.
    android.util.Log.i(
      "LiquidGlass",
      "render tier=$tier shaderCompiled=$compiled sdk=${Build.VERSION.SDK_INT}"
    )

    // The AGSL is expected to compile on API 33+; if it did not, the view is
    // silently a tier lower than the device can do, which is worth an error and
    // not just a tier report.
    if (!compiled && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      emitError(
        GlassErrorEvent.SHADER_COMPILE_FAILED,
        "The AGSL glass shader did not compile on API ${Build.VERSION.SDK_INT}; " +
          "falling back to blur + tint."
      )
    }

    dispatch(
      GlassPipelineReadyEvent(
        UIManagerHelper.getSurfaceId(this),
        id,
        tier,
        Build.VERSION.SDK_INT,
        compiled
      )
    )
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    viewTreeObserver.removeOnPreDrawListener(this)
    unregisterSensor()
    // Stop being suppressed. A container sets this on its children and only
    // ever sets it back while it is still walking them — so a child removed
    // from a container, or reparented, would otherwise render NOTHING for the
    // rest of its life. Resetting on detach makes the flag owned by the
    // relationship rather than by the view.
    glassSuppressed = false

    // The bitmap belongs to the root, not to us — hand back our reference and
    // let the holder free it if we were the last glass view under it.
    SharedBackdrop.release(sharedRoot, shared)
    shared = null
    sharedRoot = null
    backdropHost = null
    backdropBelow = null
    // Force a fresh capture + repaint on the next attach (fix #1).
    haveGoodCapture = false
    lastBackdropHash = 0
    sdfBitmap?.recycle()
    sdfBitmap = null
    sdfInput = null
    maskBitmap?.recycle()
    maskBitmap = null
    maskInput = null
    gradBitmap?.recycle()
    gradBitmap = null
    gradInput = null
    sdfKey = ""
  }

  // ---- Backdrop capture (once per frame, before drawing) ----

  override fun onPreDraw(): Boolean {
    if (SharedBackdrop.capturing || width == 0 || height == 0) return true
    // A paused or off-screen view keeps its last frame and stops doing the one
    // expensive thing here: a full software `root.draw()` into our bitmap, every
    // frame, for as long as the view exists.
    if (captureSuspended) return true
    // Inside a compositing backdrop host the glass reads a display list; there
    // is no bitmap to capture and no hash to watch — the host repaints us.
    // What we DO have to watch is our own placement: the host draws us at a
    // position it computed when it last recorded, and a scroll or transform
    // between us and it does not re-record the host on its own.
    val host = backdropHost
    if (host != null && host.layerActive) {
      if (placementChanged(host)) {
        host.invalidate()
        // Cancel this pass so the host re-records in the same frame; the
        // re-run sees no further change and proceeds.
        return false
      }
      return true
    }
    // Timed only when someone asked for stats — System.nanoTime() twice a frame
    // is cheap, but "cheap" is not "free" and this runs on every glass view.
    if (frameStatsInterval > 0) {
      val t0 = System.nanoTime()
      captureBackdrop()
      statsPendingCaptureNs = System.nanoTime() - t0
    } else {
      captureBackdrop()
    }
    // Only repaint when the backdrop actually changed (fix #1). Comparing a
    // cheap sampled hash breaks the old self-sustaining 60fps capture→invalidate
    // loop: on a static screen the hash settles and we stop; when content
    // behind scrolls/animates, onPreDraw fires from THAT invalidation, the hash
    // differs, and we repaint one fresh frame.
    val hash = backdropHash()
    if (!haveGoodCapture || hash != lastBackdropHash) {
      lastBackdropHash = hash
      haveGoodCapture = true
      // Schedule the repaint OUTSIDE this draw pass. invalidate() issued from
      // within onPreDraw is unreliably coalesced by HWUI — that dropped repaint
      // is what let a stale/black first capture stick as a full-screen ghost.
      // postInvalidateOnAnimation() reliably lands on the next frame.
      postInvalidateOnAnimation()
    }
    return true
  }

  // A sparse sampled hash of the captured backdrop — enough to notice a scroll
  // or content change without the cost of comparing every pixel each frame.
  /**
   * A cheap sampled hash of *this view's* region of the shared backdrop.
   *
   * Deliberately not a hash of the whole shared bitmap: that would repaint
   * every glass view whenever anything anywhere moved, throwing away the
   * per-view dirty detection that stopped the self-sustaining 60fps loop.
   */
  private fun backdropHash(): Int {
    val bmp = captured ?: return 0
    if (!sharedSrcRect(bmp, hashRect)) return 0
    var hash = 1
    val cols = 6
    val rows = 5
    for (r in 0 until rows) {
      val y = hashRect.top + if (rows == 1) 0 else (hashRect.height() - 1) * r / (rows - 1)
      for (c in 0 until cols) {
        val x = hashRect.left + if (cols == 1) 0 else (hashRect.width() - 1) * c / (cols - 1)
        hash = hash * 31 + bmp.getPixel(
          x.coerceIn(0, bmp.width - 1),
          y.coerceIn(0, bmp.height - 1)
        )
      }
    }
    return hash
  }

  private fun captureBackdrop() {
    val root = rootView ?: return
    val cap = shared ?: return
    if (width <= 0 || height <= 0) return

    // getDrawingTime() is identical for every view drawn in the same frame, so
    // the first glass view to arrive does the work and the rest no-op.
    val failure = cap.captureIfNeeded(root, root.drawingTime)
    if (failure != null) {
      emitError(
        GlassErrorEvent.BACKDROP_CAPTURE_FAILED,
        "A view behind the glass could not be drawn to a software canvas " +
          "(${failure.javaClass.simpleName}), so the previous backdrop is being " +
          "reused. SurfaceView, TextureView and some video/map views cannot " +
          "be captured this way."
      )
    }
  }

  /**
   * This view's rectangle inside the shared, root-sized backdrop bitmap.
   *
   * Replaces the per-view canvas translation the old capture did: instead of
   * every view drawing the root at its own offset, everyone reads one bitmap
   * and differs only in where they read from.
   */
  private fun sharedSrcRect(bmp: Bitmap, out: Rect): Boolean =
    paddedSrcRect(bmp, 0, out, scratchPad)

  /**
   * [sharedSrcRect] grown by up to [pad] bitmap pixels on every side, as far as
   * the bitmap actually extends there.
   *
   * The blur needs real neighbours. Cropping the capture to exactly the view
   * and blurring with CLAMP means the outer ring of the blur is averaging
   * clamped edge pixels — a streak along every border that follows whatever
   * colour happened to sit on the edge. The shared bitmap already holds the
   * pixels around the view, so the fix is to feed the blur a margin and let the
   * shader crop it back. At the screen edge there is no margin to give, and
   * CLAMP is then the right answer, so the padding is asymmetric: [padOut]
   * reports what was actually taken per side (left, top, right, bottom).
   */
  private fun paddedSrcRect(bmp: Bitmap, pad: Int, out: Rect, padOut: Rect): Boolean {
    val root = rootView ?: return false
    getLocationInWindow(locThis)
    root.getLocationInWindow(locRoot)
    val left = (locThis[0] - locRoot[0]) / captureScale
    val top = (locThis[1] - locRoot[1]) / captureScale
    val right = left + width / captureScale
    val bottom = top + height / captureScale
    if (right <= 0 || bottom <= 0 || left >= bmp.width || top >= bmp.height) return false
    val l = left.coerceIn(0, bmp.width)
    val t = top.coerceIn(0, bmp.height)
    val r = right.coerceIn(0, bmp.width)
    val b = bottom.coerceIn(0, bmp.height)
    if (r <= l || b <= t) return false
    val pl = min(pad, l)
    val pt = min(pad, t)
    val pr = min(pad, bmp.width - r)
    val pb = min(pad, bmp.height - b)
    out.set(l - pl, t - pt, r + pr, b + pb)
    padOut.set(pl, pt, pr, pb)
    return true
  }

  override fun draw(canvas: Canvas) {
    // Skipped for ANY shared capture, not just one this view triggered. The
    // bitmap is shared, so it must contain no glass at all — see SharedBackdrop.
    if (SharedBackdrop.capturing) return
    // Likewise while a backdrop host records its content: we must not be in
    // our own backdrop. The host draws us afterwards, on top of it — and once
    // it is compositing, that explicit draw is the only one that counts.
    val host = backdropHost
    if (host != null && (host.recording || (host.layerActive && !drawingFromHost))) return
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
    // A container renders the merged glass for all of us; drawing our own on
    // top would double the material and defeat the merge.
    if (glassSuppressed) return

    val w = width.toFloat()
    val h = height.toFloat()
    if (w <= 0 || h <= 0) return

    // Ease the press strength toward its target and keep animating until settled.
    // The press effect is an OPTICAL magnification in the shader (below) — the
    // element keeps its size; only the glass lenses harder under the finger.
    // Spring, not an exponential ease. A `+= delta * 0.2` approach is always
    // decelerating: it leaves fastest at the start and crawls into the target,
    // which reads as soft and laggy next to iOS. A lightly under-damped spring
    // arrives quickly and settles with a small overshoot, which is what a
    // physical material does and what UIKit animates with.
    if (interactive &&
      (kotlin.math.abs(touchTarget - touchAmt) > 0.002f ||
        kotlin.math.abs(touchVel) > 0.01f)
    ) {
      val dt = 1f / 60f
      val accel = SPRING_K * (touchTarget - touchAmt) - SPRING_C * touchVel
      touchVel += accel * dt
      touchAmt = (touchAmt + touchVel * dt).coerceIn(0f, 1.15f)
      postInvalidateOnAnimation()
    }

    // Refresh the custom-shape SDF if the silhouette or size changed.
    ensureShape(width, height)
    val shapePath = scaledShapePath

    val bmp = captured
    val statsT0 = if (frameStatsInterval > 0) System.nanoTime() else 0L
    val host = backdropHost
    val below = backdropBelow
    val useLayer = layerMode && host != null && below != null && computeHostTransform(host)
    val node = if (useLayer) layerNode else effectNode
    val haveBitmap = bmp != null && !bmp.isRecycled
    if (node != null && canvas.isHardwareAccelerated && (useLayer || haveBitmap)) {
      val blurPx = GlassParams.blurRadiusPx(intensity, variantClear, density, blurRadiusDp)
      // Grow the node by the blur radius so the blur has real neighbours at
      // the rim (see paddedSrcRect). The view region lands at (padL, padT)
      // inside the node; the shader is told the offset and crops back to it.
      val padL: Int
      val padT: Int
      val nodeW: Int
      val nodeH: Int
      if (useLayer) {
        // Layer path: the backdrop is the host's display list, drawn through
        // the inverse of our placement so that, once the host applies our
        // transform, the world behind us lands exactly where it is on screen.
        // Padding is clamped to the host's bounds — beyond them there is
        // nothing to blur, and CLAMP at the node edge is the right answer.
        hostRect.set(0f, 0f, width.toFloat(), height.toFloat())
        hostMatrix.mapRect(hostRect)
        val pad = ceil(blurPx).toInt()
        padL = min(pad, hostRect.left.toInt()).coerceAtLeast(0)
        padT = min(pad, hostRect.top.toInt()).coerceAtLeast(0)
        val padR = min(pad, (host!!.width - hostRect.right).toInt()).coerceAtLeast(0)
        val padB = min(pad, (host.height - hostRect.bottom).toInt()).coerceAtLeast(0)
        nodeW = width + padL + padR
        nodeH = height + padT + padB
        node.setPosition(-padL, -padT, -padL + nodeW, -padT + nodeH)
        val rec = node.beginRecording()
        rec.translate(padL.toFloat(), padT.toFloat())
        rec.concat(hostInverse)
        rec.drawRenderNode(below!!)
        node.endRecording()
      } else {
        val padWanted = ceil(blurPx / captureScale).toInt()
        if (!paddedSrcRect(bmp!!, padWanted, srcRect, padRect)) {
          srcRect.set(0, 0, bmp.width, bmp.height)
          padRect.set(0, 0, 0, 0)
        }
        padL = padRect.left * captureScale
        padT = padRect.top * captureScale
        nodeW = width + padL + padRect.right * captureScale
        nodeH = height + padT + padRect.bottom * captureScale
        node.setPosition(-padL, -padT, -padL + nodeW, -padT + nodeH)
        val rec = node.beginRecording()
        dstRect.set(0, 0, nodeW, nodeH)
        rec.drawBitmap(bmp, srcRect, dstRect, null)
        node.endRecording()
      }
      node.setRenderEffect(buildEffect(width, height, blurPx, padL, padT, nodeW, nodeH))
      // Analytic path: the node's own outline rounds it, anti-aliased, the way
      // the view's clipToOutline used to. In node coordinates the view sits at
      // (padL, padT). Custom shape: the shader's mask alpha is the silhouette.
      if (shapePath == null) {
        effectOutline.setRoundRect(
          padL, padT, padL + width, padT + height, cornerFor(width, height)
        )
        node.setOutline(effectOutline)
        node.setClipToOutline(true)
      } else {
        node.setClipToOutline(false)
      }
      //
      // `Canvas.clipPath` is NOT anti-aliased on a hardware canvas — it is a
      // hard per-pixel stencil. Applying it on top of the shader's smooth,
      // anti-aliased silhouette alpha sawed that edge straight back off, which
      // is the stair-stepped, speckled rim on every custom shape. The clip is
      // still needed for the blur-only fallback below API 33, where nothing
      // else bounds the render node — but where the shader runs, the mask is
      // the silhouette and the clip can only make it worse.
      if (shapePath != null && !shaderActive) {
        canvas.save()
        canvas.clipPath(shapePath)
        canvas.drawRenderNode(node)
        canvas.restore()
      } else {
        canvas.drawRenderNode(node)
      }
      // Folded here rather than at the end of onDraw: this block is the work
      // the stats are about — recording the node and re-uploading uniforms.
      // Note this is CPU time; the GPU's shader execution is not visible to us.
      if (frameStatsInterval > 0) recordFrameStats(System.nanoTime() - statsT0)
    }

    if (!shaderActive) {
      if (shapePath != null) {
        canvas.drawPath(shapePath, frostPaint)
        canvas.drawPath(shapePath, tintPaint)
      } else {
        val cr = cornerFor(width, height)
        canvas.drawRoundRect(0f, 0f, w, h, cr, cr, frostPaint)
        canvas.drawRoundRect(0f, 0f, w, h, cr, cr, tintPaint)
        drawCanvasSpecular(canvas, w, h)
      }
    }

    // Legibility floor (#2): a neutral veil laid over the glass but UNDER the
    // React children (they draw later in dispatchDraw), so foreground chrome
    // stays readable over `clear` glass without darkening the whole pane. We
    // adapt the veil to the captured backdrop's average luminance — darker over
    // bright backdrops, near-black stays subtle over dark ones — and let the
    // tint colour hue it so it coheres with the glass.
    if (legibilityFloor > 0f) {
      legibilityPaint.color = legibilityVeilColor()
      if (shapePath != null) {
        canvas.drawPath(shapePath, legibilityPaint)
      } else {
        val cr = cornerFor(width, height)
        canvas.drawRoundRect(0f, 0f, w, h, cr, cr, legibilityPaint)
      }
    }

    // Crisp bright rim outline — only where the shader is NOT drawing one.
    //
    // Both were drawing it, which is the double edge Android had and iOS did
    // not: a Canvas stroke sitting on the outer boundary plus the shader's own
    // `rimLine` a pixel or two inside it, reading as a sticker outline rather
    // than a single glass edge. The shader's line is the better one now that
    // `d` is precise on both paths, so it owns the rim and this stroke is the
    // fallback for the tiers that have no shader.
    if (shaderActive || !rimEnabled) {
      // Shader owns the rim, or the caller turned it off.
    } else if (shapePath != null) {
      canvas.drawPath(shapePath, rimPaint)
    } else {
      val inset = rimPaint.strokeWidth / 2f
      val cr = cornerFor(width, height)
      canvas.drawRoundRect(inset, inset, w - inset, h - inset, cr, cr, rimPaint)
    }

    // Last thing in the first draw: `shaderActive` is settled by now, and every
    // tier reaches this point — the previous report sat inside the RenderNode
    // branch, so a device on the tint tier never reported at all.
    // ONLY from a hardware draw. `captureBackdrop` renders the whole root into a
    // software canvas, and that traversal re-enters every OTHER glass view's
    // `onDraw` — where the render-node branch is skipped and `shaderActive` is
    // false. Reporting from one of those passes is what latched `blur` on
    // devices that refract on every real frame (#74).
    if (canvas.isHardwareAccelerated) emitPipelineReady()
  }

  // Colour of the legibility veil: a dark scrim whose opacity scales with
  // `legibilityFloor` AND with the backdrop brightness (a bright backdrop needs
  // more veil to keep light chrome readable). Hued toward the tint when one is
  // set so it doesn't fight the glass colour.
  private fun legibilityVeilColor(): Int {
    val floor = legibilityFloor.coerceIn(0f, 1f)
    val lum = backdropLuminance() // 0 (dark) → 1 (bright)
    // Lift the veil up to ~1.4× over a fully bright backdrop, cap at 0.62 alpha.
    val alpha = (floor * (0.7f + 0.7f * lum) * 255f).toInt().coerceIn(0, 158)
    val tint = tintColor
    return if (tint != null && Color.alpha(tint) > 0) {
      // Darkened tint hue.
      Color.argb(alpha, Color.red(tint) / 3, Color.green(tint) / 3, Color.blue(tint) / 3)
    } else {
      Color.argb(alpha, 0, 0, 0)
    }
  }

  // Average luminance of the captured backdrop from the same sparse grid the
  // dirty-hash uses — cheap, and only read when a legibility veil is active.
  private fun backdropLuminance(): Float {
    val bmp = captured ?: return 0.5f
    val w = bmp.width
    val h = bmp.height
    if (w <= 0 || h <= 0) return 0.5f
    var sum = 0f
    var count = 0
    val cols = 6
    val rows = 5
    for (r in 0 until rows) {
      val y = if (rows == 1) 0 else (h - 1) * r / (rows - 1)
      for (c in 0 until cols) {
        val x = if (cols == 1) 0 else (w - 1) * c / (cols - 1)
        val px = bmp.getPixel(x, y)
        sum += (0.299f * Color.red(px) + 0.587f * Color.green(px) + 0.114f * Color.blue(px)) / 255f
        count++
      }
    }
    return if (count == 0) 0.5f else sum / count
  }

  // Clip React children to the custom silhouette so icons/labels don't spill
  // outside the shape. No-op for the analytic path (clipToOutline handles it).
  override fun dispatchDraw(canvas: Canvas) {
    val shapePath = scaledShapePath
    val content = childrenNode
    if (shapePath != null) {
      canvas.save()
      canvas.clipPath(shapePath)
      super.dispatchDraw(canvas)
      canvas.restore()
    } else if (content != null && canvas.isHardwareAccelerated && width > 0 && height > 0) {
      // Rounded-rect children go through a node with an outline clip: that is
      // the anti-aliased rounding the view's clipToOutline used to give, minus
      // the side effect of clipping the background (and its box shadow) too.
      contentOutline.setRoundRect(0, 0, width, height, cornerFor(width, height))
      content.setPosition(0, 0, width, height)
      content.setOutline(contentOutline)
      content.setClipToOutline(true)
      val rc = content.beginRecording()
      try {
        super.dispatchDraw(rc)
      } finally {
        content.endRecording()
      }
      canvas.drawRenderNode(content)
    } else {
      super.dispatchDraw(canvas)
    }
  }

  /**
   * Blur → (optional) AGSL material chain. Mirrors the iOS compositing order.
   *
   * @param w,h the VIEW size — the shader's coordinate space.
   * @param padL,padT where the view sits inside the padded node.
   * @param nodeW,nodeH the padded node size, i.e. the extent of `content`.
   */
  private fun buildEffect(
    w: Int,
    h: Int,
    radius: Float,
    padL: Int,
    padT: Int,
    nodeW: Int,
    nodeH: Int,
  ): RenderEffect {
    val blur = RenderEffect.createBlurEffect(radius, radius, Shader.TileMode.CLAMP)

    val shader = glassShader
    if (shader == null) {
      shaderActive = false
      return blur
    }
    // Custom silhouette: feed the SDF texture and switch the shader's shape
    // sampler over to it. Otherwise bind the 1×1 dummy (the branch is unused).
    val useSdf =
      scaledShapePath != null && sdfInput != null && maskInput != null && gradInput != null
    return try {
      // `setInputBuffer`, not `setInputShader`: these three are DATA, not
      // colour. `setInputShader` runs the bitmap through the working colour
      // space, which on a wide-gamut surface quietly reshapes the packed
      // distance codes and normals; the buffer binding samples the bytes as
      // stored, which is what a distance field wants.
      shader.setInputBuffer("sdf", if (useSdf) sdfInput!! else dummyShader)
      shader.setInputBuffer("mask", if (useSdf) maskInput!! else dummyShader)
      shader.setInputBuffer("grad", if (useSdf) gradInput!! else dummyShader)
      shader.setFloatUniform("iUseSdf", if (useSdf) 1f else 0f)
      shader.setFloatUniform("iSdfRange", sdfRange)
      shader.setFloatUniform("iResolution", w.toFloat(), h.toFloat())
      shader.setFloatUniform("iOffset", padL.toFloat(), padT.toFloat())
      shader.setFloatUniform("iContentSize", nodeW.toFloat(), nodeH.toFloat())
      shader.setFloatUniform("iRimFalloff", rimFalloff)
      shader.setFloatUniform("iDispersion", dispersion)
      // No corner radius for a custom shape — feed a nominal feature size so the
      // rim/lens band widths (derived from iCorner) stay sensible. The tuned
      // reference is the example's pill dock: 28dp radius on a 64dp height =
      // 0.44·minDim, and that ratio is what makes its whole surface read as a
      // deep liquid lens. 0.2 made custom shapes visibly flatter than the pill.
      shader.setFloatUniform("iCorner", if (useSdf) min(w, h) * 0.4f else cornerFor(w, h))
      // Lensing is intrinsic to glass (always on); the `refraction` prop only
      // dials it up. This is what makes the backdrop bend around the edges.
      // `ior` scales the lens on the CPU rather than as another per-pixel
      // uniform. Normalised so 1.5 (window glass) is exactly 1.0x — the tuned
      // look — and 1.0 (vacuum) is 0.0x, i.e. no bending at all.
      shader.setFloatUniform(
        "iLens",
        GlassParams.lensStrengthPx(variantClear, refractionEnabled, density) *
          thickness * ((ior - 1f) / 0.5f)
      )
      // Measured against iOS 26 over the same wallpaper: with the blur
      // matched, clear glass was holding sat 0.721x its backdrop where iOS
      // holds 0.656x. The old 1.55 only looked right while the heavier blur
      // was washing saturation out for it.
      shader.setFloatUniform("iSat", (if (variantClear) 1.32f else 1.3f) * saturation)
      shader.setFloatUniform("iLift", GlassParams.frostFloorAlpha(variantClear))
      shader.setFloatUniform("iAdapt", GlassParams.adaptiveLift(variantClear))
      shader.setFloatUniform("iSpecular", if (specularEnabled) GlassParams.specularAlpha(variantClear) else 0f)
      // Broad glassy face reflection. Kept subtle on clear — a big milky sheen
      // band is exactly what makes clear glass read as frosted rather than clear.
      shader.setFloatUniform("iSheen", if (!specularEnabled) 0f else if (variantClear) 0.07f else 0.10f)
      shader.setFloatUniform("iRim", if (rimEnabled) 1f else 0f)
      shader.setFloatUniform("iDim", dim)
      shader.setFloatUniform("iTilt", tiltX, tiltY)
      shader.setFloatUniform("iTouch", touchX, touchY)
      shader.setFloatUniform("iTouchAmt", if (interactive) touchAmt else 0f)
      shader.setFloatUniform("iRefl", edgeReflectionStrength)
      shader.setFloatUniform("iIrid", iridescence)
      shader.setFloatUniform("iGrain", grain)
      shader.setFloatUniform("iLightAngle", lightAngle)
      shader.setFloatUniform("iSpecSharp", specularSharpness)
      shader.setFloatUniform("iBright", brightness)
      shader.setFloatUniform("iMag", magnification)
      shader.setFloatUniform("iBodyCount", bodyCount.toFloat())
      shader.setFloatUniform("iMergeK", max(1f, mergeSpacingPx))
      shader.setFloatUniform("iBodies", bodyRects)
      shader.setFloatUniform("iBodyR", bodyRadii)
      setTintUniform(shader)
      val material = RenderEffect.createRuntimeShaderEffect(shader, "content")
      shaderActive = true
      RenderEffect.createChainEffect(material, blur)
    } catch (t: Throwable) {
      // Was swallowed entirely. If applying the RenderEffect throws, the view
      // loses the whole refraction tier while `shaderCompiled` still reports
      // true (the shader object exists) — so the only outward sign was the tier
      // quietly reading `blur`, with nothing in logcat to explain it. Every
      // other degradation in this file is reported; this one is now too.
      shaderActive = false
      android.util.Log.w(
        "LiquidGlass",
        "The AGSL shader compiled but could not be applied as a RenderEffect on " +
          "API ${Build.VERSION.SDK_INT} (${t.javaClass.simpleName}: ${t.message}); " +
          "falling back to blur.",
        t
      )
      emitError(
        GlassErrorEvent.SHADER_COMPILE_FAILED,
        "The AGSL glass shader compiled but could not be applied as a " +
          "RenderEffect on API ${Build.VERSION.SDK_INT} " +
          "(${t.javaClass.simpleName}); falling back to blur + tint."
      )
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
    val cr = cornerFor(width, height)
    canvas.drawRoundRect(0f, 0f, w, h, cr, cr, specularPaint)
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
    // Lightly under-damped: omega = sqrt(K) ~ 16 rad/s, critical damping would
    // be 2*sqrt(K) ~ 32, so C = 26 settles fast with a small overshoot.
    private const val SPRING_K = 260f
    private const val SPRING_C = 26f

    /**
     * Draws to wait for `shaderActive` to settle before reporting a tier.
     *
     * In practice the effect path is reached on the second draw; a handful of
     * frames is generous enough to cover a slow first layout without leaving a
     * genuinely-failing view unreported for a visible length of time.
     */
    /**
     * Bodies a container can merge. Matches the AGSL uniform array size — SkSL
     * needs a compile-time bound, so this is a hard cap rather than a hint.
     */
    const val MAX_BODIES = 8

    private const val MAX_TIER_REPORT_DEFERRALS = 5

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
      uniform shader sdf;
      uniform shader mask;
      uniform shader grad;
      uniform float iUseSdf;
      uniform float iSdfRange;
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
      uniform float iRefl;
      uniform float iRim;
      uniform float iDim;
      uniform float iIrid;
      uniform float iGrain;
      uniform float iLightAngle;
      uniform float iSpecSharp;
      uniform float iBright;
      uniform float iMag;
      uniform float iBodyCount;
      uniform float iMergeK;
      uniform float4 iBodies[8];
      uniform float iBodyR[8];
      // Where the view sits inside the blur-padded node, and the node's size.
      uniform float2 iOffset;
      uniform float2 iContentSize;
      uniform float iRimFalloff;
      uniform float iDispersion;

      float sdRoundRect(float2 p, float2 b, float r) {
        float2 q = abs(p) - b + r;
        return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
      }

      // Polynomial smooth minimum (IQ). Identical to GlassSdf.smin, so the
      // analytic container merge and the baked secondaryShape merge agree.
      float smin(float a, float b, float k) {
        float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
        return mix(b, a, h) - k * h * (1.0 - h);
      }

      // Fold every body's rounded-rect distance together. Analytic, so this is
      // a handful of ALU per pixel rather than a texture fetch into a field
      // that had to be rebuilt on the CPU.
      float mergedDist(float2 coord) {
        float d = 1e9;
        for (int i = 0; i < 8; i++) {
          if (float(i) >= iBodyCount) break;
          float4 b4 = iBodies[i];
          float di = sdRoundRect(coord - b4.xy, b4.zw, iBodyR[i]);
          d = (i == 0) ? di : smin(d, di, iMergeK);
        }
        return d;
      }

      // Distance plus the geometry of the NEAREST body: its corner radius and
      // its smaller half-extent.
      //
      // The optics bands have to be per-body, not per-container and not one
      // representative value. Merging a 132px circle (r=66) with a 168px
      // squircle (r=22) and using the circle's radius for both gave the
      // squircle a lens band four times too wide, which reads as gross
      // over-magnification. Nearest-body wins, which is also the body whose
      // surface the pixel actually belongs to.
      float3 mergedProbe(float2 coord) {
        float d = 1e9;
        float best = 1e9;
        float r = 0.0;
        float halfMin = 0.0;
        for (int i = 0; i < 8; i++) {
          if (float(i) >= iBodyCount) break;
          float4 b4 = iBodies[i];
          float di = sdRoundRect(coord - b4.xy, b4.zw, iBodyR[i]);
          d = (i == 0) ? di : smin(d, di, iMergeK);
          if (di < best) {
            best = di;
            r = iBodyR[i];
            halfMin = min(b4.z, b4.w);
          }
        }
        return float3(d, r, halfMin);
      }

      // Rotate the built-in light direction. `lightAngle` is an OFFSET, not an
      // absolute bearing, so 0 reproduces the tuned top-left key light exactly
      // and existing layouts are unaffected.
      float2 rotate2(float2 v, float a) {
        float c = cos(a);
        float s = sin(a);
        return float2(v.x * c - v.y * s, v.x * s + v.y * c);
      }

      // Cheap per-pixel hash for the grain. Deterministic in screen space, so
      // the grain sits still on a static surface instead of crawling.
      float hash21(float2 p) {
        return fract(sin(dot(p, float2(12.9898, 78.233))) * 43758.5453);
      }

      // Surface normal + medial-axis confidence for the custom-shape path,
      // from the CPU-precomputed normal texture (R/G = unit gradient around
      // 0.5, B = |gradient|). Differentiating the distance TEXTURE in-shader
      // leaves per-texel direction wobble that the ~100px mirror displacement
      // magnifies into radial shatter — the CPU field is float-exact and
      // pre-smoothed, and its channels vary slowly enough that hardware
      // bilinear over the packed bytes is safe.
      float3 sdfGrad(float2 q) {
        half4 v = grad.eval(q);
        return float3(float(v.r) * 2.0 - 1.0, float(v.g) * 2.0 - 1.0, float(v.b));
      }

      half4 main(float2 nodeCoord) {
        // The node is padded by the blur radius on each side (see onDraw) so
        // the blur has real neighbours at the rim instead of clamped edge
        // pixels. Everything below thinks in VIEW space; only the `content`
        // taps translate back into node space. The margin itself is cropped
        // here, so nothing draws outside the view.
        float2 coord = nodeCoord - iOffset;
        if (coord.x < 0.0 || coord.y < 0.0 ||
            coord.x >= iResolution.x || coord.y >= iResolution.y) {
          return half4(0.0);
        }
        float2 b = iResolution * 0.5;
        float2 p = coord - b;

        // Distance + the two band ramps that drive every optic. The analytic
        // rounded-rect computes them exactly; a custom shape reads them from
        // the SDF texture (R = d, G = lens rim ramp, B = mirror band ramp) —
        // the ramps are precomputed in FLOAT on the CPU because deriving them
        // from the quantised 8-bit distance leaves ripple that the mirror
        // fold, where sensitivity diverges, magnifies into visible rings.
        float d;
        float rim;
        float edgeBand;
        // Band widths scale with the surface the optics belong to. For a
        // container that is the merged BODY, not the container's own bounds —
        // an absoluteFill container was giving a 132px lens the mirror band of
        // a 1080px surface, which reads as wild over-magnification.
        // Defaults for the single-surface paths; the merged branch below
        // overrides them per pixel from the nearest body.
        float lensW = max(28.0, iCorner * 1.4);
        float reflW = max(14.0, min(b.x, b.y) * 0.7);
        if (iBodyCount > 0.0) {
          // Analytic container merge — no SDF texture involved at all.
          float3 probe = mergedProbe(coord);
          d = probe.x;
          lensW = max(28.0, probe.y * 1.4);
          reflW = max(14.0, probe.z * 0.7);
          rim = 1.0 - clamp(-d / lensW, 0.0, 1.0);
          edgeBand = 1.0 - clamp(-d / reflW, 0.0, 1.0);
        } else if (iUseSdf > 0.5) {
          half4 s = sdf.eval(coord);
          // Square-law decode, matching GlassSdf's encoding: the codes are
          // packed densely near the edge, where `rimLine` and `edgeGuard` need
          // sub-pixel accuracy, and sparsely in the far field, which only feeds
          // band masks tens of pixels wide.
          float u = (float(s.r) - 0.5) * 2.0;
          d = u * abs(u) * iSdfRange;
          rim = float(s.g);
          edgeBand = float(s.b);
        } else {
          d = sdRoundRect(p, b, iCorner);
          rim = 1.0 - clamp(-d / lensW, 0.0, 1.0);
          edgeBand = 1.0 - clamp(-d / reflW, 0.0, 1.0);
        }

        // Outward surface gradient (points to the nearest edge). Custom shapes
        // read the CPU-precomputed normal field (in-shader finite differences
        // of the packed texture wobble per texel — see sdfGrad); the analytic
        // rounded-rect differentiates its exact SDF.
        float2 g;
        float conf;
        if (iBodyCount > 0.0) {
          // Same wide central difference the analytic rounded-rect uses: the
          // merged field is exact, so |grad| collapses only near the medial
          // axis, and a narrow epsilon would turn that into a hard seam.
          float e = clamp(lensW * 0.3, 1.0, 16.0);
          float gx = mergedDist(coord + float2(e, 0.0)) - mergedDist(coord - float2(e, 0.0));
          float gy = mergedDist(coord + float2(0.0, e)) - mergedDist(coord - float2(0.0, e));
          g = float2(gx, gy);
          conf = length(g) / (2.0 * e);
        } else if (iUseSdf > 0.5) {
          float3 gv = sdfGrad(coord);
          g = gv.xy;
          conf = gv.z;
        } else {
          // Sampled over a WIDE epsilon, not 1px. `sdRoundRect` is an exact
          // distance field, so |grad| is 1 everywhere except within a pixel of
          // the medial axis, where the two sides cancel and it drops to 0. With
          // e = 1 that made `conf` — and therefore `axisFade` below — a 1px
          // notch of zero refraction with full refraction either side, which is
          // the hard line across the middle of a pill (the axis of a wide, short
          // shape is a horizontal line straight through the centre).
          //
          // Widening the sample to the scale of the lens ring makes the two
          // sides cancel *gradually* over tens of pixels instead, so the lens
          // eases off toward the axis. The direction is unaffected away from the
          // axis: over any span where the field is locally linear, a wide
          // central difference gives the same unit normal a narrow one does.
          float e = clamp(lensW * 0.3, 1.0, 16.0);
          float gx = sdRoundRect(p + float2(e, 0.0), b, iCorner) - sdRoundRect(p - float2(e, 0.0), b, iCorner);
          float gy = sdRoundRect(p + float2(0.0, e), b, iCorner) - sdRoundRect(p - float2(0.0, e), b, iCorner);
          g = float2(gx, gy);
          conf = length(g) / (2.0 * e);
        }
        float2 n2 = g / (length(g) + 1e-5);

        // The SDF gradient collapses along the shape's medial axis (the ridge
        // equidistant from two edges). On a short/pill shape the top and bottom
        // lens rings meet there and the normal flips, so the lens has to ease
        // off toward that ridge or the two rings collide into a seam.
        //
        // The ramp itself is unchanged. What matters is that `conf` now varies
        // smoothly across the ridge on the analytic path (see the wide epsilon
        // above) instead of stepping 1 → 0 → 1 within two pixels, which turned
        // this fade into the very seam it exists to prevent.
        float axisFade = smoothstep(0.15, 0.8, conf);

        // Lens profile. `rim` ramps 0 (interior) → 1 (at the very edge) across
        // a ring `lensW` px wide. `bend` is a steep power of it, so almost all
        // the refraction happens in the outer ring — the centre stays clear.
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
        float2 magCoord = coord - td * (iTouchAmt * tFall * 0.17);

        // Edge reflection: a lens band at the rim that folds the sample back on
        // itself, so content near the edge appears mirrored — the inverted echo
        // iOS shows at the top & bottom of a glass pill. Verified against iOS 26
        // side-by-side: the OS band is BROAD and soft (roughly the outer third
        // of the surface each side, with big smooth warps flowing well into the
        // glass) — a thin cubed band reads as a hard streak, not liquid. So the
        // band spans 0.35·minDim with a squared falloff. `axisFade` keeps it
        // off the medial-axis (no seam); scales with iLens so a flat pane
        // (thickness 0) has no reflection.
        // Edge guard: taper ALL refraction to zero across the outermost few px.
        // Displacement peaks AT the rim, where it most magnifies the residual
        // sub-pixel normal noise into radial "cracked glass" hairlines. A thin
        // calm bevel there erases the fringe; the lens band just inside (tens of
        // px wide) is untouched, and the crisp bright rim line below still draws
        // the edge. Analytic shapes have no noise, so this is a no-op for them
        // beyond a marginally softer edge.
        // Widened, and scaled to the mirror band rather than a fixed 12px. The
        // guard multiplies a displacement of ~iLens*3, so a steep ramp turns
        // any residual noise in `d` into radial smear; spreading it over a
        // proportional distance keeps the same calm bevel with a far gentler
        // derivative.
        float edgeGuard = smoothstep(0.0, max(12.0, reflW * 0.18), -d);

        // `iRefl` (edgeReflectionStrength, 0–1) scales ONLY this reflection band
        // — independent of iLens/thickness — so the upside-down edge echo can be
        // calmed over text-heavy backdrops without flattening the whole lens.
        float reflMask = edgeBand * edgeBand * axisFade;
        float2 reflDisp = n2 * reflMask * (iLens * 3.0 * iRefl) * edgeGuard;

        float2 disp = n2 * bend * iLens * edgeGuard;
        // Constant centre magnification: sample a smaller region of the backdrop
        // and let it fill the surface. Applied about the view centre and BEFORE
        // the edge displacement, so the lens still bends whatever the
        // magnified surface is showing rather than fighting it.
        //
        // Distinct from the touch magnifier in `magCoord` above, which is
        // transient and follows the finger; this is a property of the glass.
        float2 magBase = iMag == 1.0 ? magCoord : b + (magCoord - b) / iMag;
        float2 uv = magBase - disp - reflDisp;

        // Chromatic dispersion at the rim: split R/G/B along the normal. Kept
        // VERY subtle — iOS UI glass shows almost no prismatic rainbow; a large
        // split reads as an artefact, not glass.
        // `dispersion` scales the split up to a deliberate spectral fringe.
        float2 ca = n2 * bend * iLens * (0.018 + 0.25 * iDispersion);
        // Content taps are in NODE space and may reach into the blur margin.
        float2 cuv = uv + iOffset;
        float2 tapLo = float2(0.0);
        float2 tapHi = iContentSize - 1.0;
        half3 src;
        if (iDispersion <= 0.0) {
          src.r = content.eval(clamp(cuv + ca, tapLo, tapHi)).r;
          src.g = content.eval(clamp(cuv,      tapLo, tapHi)).g;
          src.b = content.eval(clamp(cuv - ca, tapLo, tapHi)).b;
        } else {
          // Seven spectral taps from red (+ca) to violet (-ca), each channel's
          // weights summing to one, so the fringe grades through orange, yellow
          // and cyan instead of the red/blue ghost a three-tap split gives.
          half4 t1 = content.eval(clamp(cuv + ca,               tapLo, tapHi));
          half4 t2 = content.eval(clamp(cuv + ca * (2.0 / 3.0), tapLo, tapHi));
          half4 t3 = content.eval(clamp(cuv + ca * (1.0 / 3.0), tapLo, tapHi));
          half4 t4 = content.eval(clamp(cuv,                    tapLo, tapHi));
          half4 t5 = content.eval(clamp(cuv - ca * (1.0 / 3.0), tapLo, tapHi));
          half4 t6 = content.eval(clamp(cuv - ca * (2.0 / 3.0), tapLo, tapHi));
          half4 t7 = content.eval(clamp(cuv - ca,               tapLo, tapHi));
          src.r = (t1.r + t2.r + t3.r) / 3.5 + t7.r / 7.0;
          src.g = t2.g / 7.0 + (t3.g + t4.g + t5.g) / 3.5;
          src.b = (t5.b + t6.b + t7.b) / 3.0;
        }

        // Vibrancy — glass over-saturates what it transmits.
        float luma = dot(src, half3(0.2126, 0.7152, 0.0722));
        half3 col = half3(luma) + (src - half3(luma)) * iSat;

        // Backdrop luminance grade, before the tint so it changes what the
        // glass transmits rather than the tint itself. `adapt` below still
        // reads the ungraded luma on purpose: the legibility lift should track
        // the real backdrop, not a darkened copy of it.
        col = col * half(iBright);

        // Thin adaptive frost: see-through, lifting only dark backdrop toward a
        // neutral frost so text stays legible. Never a milky fill.
        float adapt = clamp(iLift + (1.0 - luma) * iAdapt, 0.0, 0.5);
        col = mix(col, half3(1.0), adapt);

        // Vibrant coloured tint (deep, not pastel).
        // The alpha you pass is the alpha you get. This used to be
        // `iTint.a * 1.5`, so `rgba(255,55,95,0.5)` landed as a 75% mix and
        // read as a solid coloured card next to iOS, where the same colour
        // stays clearly translucent. The 1.5 was compensating for a default
        // wash that is now set correctly at source instead.
        col = mix(col, iTint.rgb, clamp(iTint.a, 0.0, 0.88));

        // Flat dimming scrim. Applied after the tint and BEFORE the lighting,
        // so a dimmed backdrop still keeps its glass edge and sheen rather
        // than going uniformly dark — that is the difference between a modal
        // backdrop made of glass and one made of a black View.
        col = col * half(1.0 - iDim);

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

        // Directional rim (rimFalloff > 0): weight the outline by how squarely
        // the edge faces the light — or faces directly away from it, hence the
        // abs — so a pill glints top-left and bottom-right and goes quiet along
        // its sides, which is how a real bevel catches a key light. The
        // exponent sharpens the glint. Shares `lightDir` with the inner shadow
        // and the tilt, so the glint moves with the device.
        float2 lightDir = normalize(rotate2(float2(-0.6, -0.8), iLightAngle) + iTilt);
        if (iRimFalloff > 0.0) {
          rimLine *= pow(max(abs(dot(n2, lightDir)), 1e-3), iRimFalloff);
        }

        // Gentle Fresnel + a small moving specular hotspot — kept subtle so the
        // rim reads as a clean outline, not a glossy bubble.
        float fres = pow(1.0 - N.z, 3.0);
        float2 Lxy = rotate2(float2(-0.5, -0.7), iLightAngle) + iTilt * 1.5;
        float3 L = normalize(float3(Lxy, 0.8));
        float spec = pow(clamp(dot(N, L), 0.0, 1.0), 10.0 * iSpecSharp);

        // Soft inner shadow on the edge opposite the light → real depth.
        float facing = clamp(dot(n2, lightDir), 0.0, 1.0);
        float edgeShade = rim * rim * (1.0 - facing) * 0.12;

        // Tint the highlights toward the glass colour so a coloured tint isn't
        // washed to grey by white specular / rim / sheen. iOS keeps tinted glass
        // saturated, and real coloured glass has coloured highlights. Untinted
        // glass keeps white highlights (its default tint IS white).
        half3 hi = mix(half3(1.0), iTint.rgb, iTint.a * 0.6);
        // rimLine carries the whole glass edge now that the Canvas stroke no
        // longer doubles it, so it is weighted to match what that stroke used
        // to contribute on top.
        col = col + hi * (sheen + rimLine * 0.80 * iRim + (fres * 0.18 + spec * 0.6) * iSpecular)
                  - half3(edgeShade);

        // Interactive touch: a soft radial bloom under the finger — iOS glass
        // brightens and "flexes" where you press. Animated in/out by iTouchAmt.
        float2 tp = coord - iTouch;
        float tr = min(iResolution.x, iResolution.y);
        float touch = exp(-dot(tp, tp) / (tr * tr)) * iTouchAmt;
        // Measured against iOS 26: pressing its glass lifts luminance about
        // 6%. At 0.2 this term alone was lifting ours by ~50% — a flash,
        // not a press.
        col = col + hi * (touch * 0.035);

        // Rim iridescence: hue swept by the angle to the centre, riding the
        // same `bend` ramp as the lens so the colour appears where the light is
        // actually being split — at the edge — rather than as a flat overlay.
        if (iIrid > 0.0) {
          float ang = atan(p.y, p.x);
          float phase = ang * 0.9549 + rim * 2.0;
          half3 irid = half3(
            half(0.5 + 0.5 * cos(phase)),
            half(0.5 + 0.5 * cos(phase + 2.0944)),
            half(0.5 + 0.5 * cos(phase + 4.1888))
          );
          col = col + irid * half(iIrid * bend * 0.6);
        }

        // Film grain. A heavy blur flattens the backdrop into a smooth
        // gradient; a little noise is what sells it as etched glass. Signed
        // around zero so it textures rather than brightens.
        if (iGrain > 0.0) {
          col = col + half3(half((hash21(coord) - 0.5) * iGrain));
        }

        col = clamp(col, 0.0, 1.0);

        // Custom shape: silhouette alpha from the FULL-RES anti-aliased coverage
        // mask (Skia's path rasterisation — crisp like a CAShapeLayer mask). An
        // alpha edge derived from the coarse 8-bit SDF wobbles per-texel and
        // reads as a serrated, broken-glass outline. The analytic rounded rect
        // stays fully opaque — its outline clip defines the silhouette. AGSL
        // blends with PREMULTIPLIED alpha, so scale the color too (straight
        // alpha here reads as a bright fog halo around the silhouette).
        // Merged bodies get their alpha from the analytic field: the container
        // view is larger than the bodies, so unlike the plain rounded-rect it
        // cannot just be opaque everywhere.
        float aa = iBodyCount > 0.0
          ? clamp(0.5 - d, 0.0, 1.0)
          : (iUseSdf > 0.5 ? float(mask.eval(coord).a) : 1.0);
        return half4(col * half(aa), half(aa));
      }
    """
  }
}
