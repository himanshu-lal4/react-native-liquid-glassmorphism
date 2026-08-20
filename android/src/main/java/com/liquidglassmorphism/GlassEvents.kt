package com.liquidglassmorphism

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

/**
 * `onPipelineReady` — fired once per view, after its first frame, reporting the
 * tier that **actually rendered**.
 *
 * This is deliberately not a device-capability check: an OS-level fallback, a
 * shader that would not compile, or a prop that forces a simpler path can all
 * hold a capable device to a lower tier. `getGlassCapabilities()` in JS answers
 * the capability question, and answers it before anything has mounted.
 */
class GlassPipelineReadyEvent(
  surfaceId: Int,
  viewId: Int,
  private val tier: String,
  private val osVersion: Int,
  private val shaderCompiled: Boolean,
) : Event<GlassPipelineReadyEvent>(surfaceId, viewId) {

  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap = Arguments.createMap().apply {
    putString("tier", tier)
    putInt("osVersion", osVersion)
    putBoolean("shaderCompiled", shaderCompiled)
    // There is no UIGlassEffect on Android at any tier; the field exists so the
    // payload is identical on both platforms.
    putBoolean("supportsNativeGlass", false)
  }

  companion object {
    const val EVENT_NAME = "topPipelineReady"
  }
}

/**
 * `onError` — the view could not do what the props asked for.
 *
 * Most reports are non-fatal: the view recovered and is still drawing, but it
 * is not drawing what was requested. Each code is latched per view by
 * [LiquidGlassmorphismView], so a failure that repeats every frame still costs
 * one bridge crossing.
 */
class GlassErrorEvent(
  surfaceId: Int,
  viewId: Int,
  private val code: String,
  private val message: String,
  private val fatal: Boolean,
) : Event<GlassErrorEvent>(surfaceId, viewId) {

  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap = Arguments.createMap().apply {
    putString("code", code)
    putString("message", message)
    putBoolean("fatal", fatal)
  }

  companion object {
    const val EVENT_NAME = "topError"

    /** The AGSL would not compile, so the view fell back to the Canvas path. */
    const val SHADER_COMPILE_FAILED = "SHADER_COMPILE_FAILED"

    /** This OS version cannot run the tier the props describe. */
    const val PIPELINE_DEGRADED = "PIPELINE_DEGRADED"

    /** The `shape` path could not be parsed; a rounded rectangle is drawn. */
    const val INVALID_SHAPE = "INVALID_SHAPE"

    /** A view behind the glass refused a software draw. */
    const val BACKDROP_CAPTURE_FAILED = "BACKDROP_CAPTURE_FAILED"
  }
}

/**
 * `onFrameStats` — a natively throttled frame-timing report (#47).
 *
 * The glass does measurable per-frame CPU work, and the only way to tune it was
 * previously a gradle → adb → screenshot loop and judging by eye. This gives a
 * number.
 *
 * Throttled and **aggregated** natively rather than forwarded per frame: at
 * 60fps a per-frame bridge crossing would cost more than the effect it is
 * measuring. Frames inside the window are averaged, not dropped, and
 * [maxTotalMs] carries the worst one — read that rather than [totalMs] when
 * hunting jank, because a single 40ms spike disappears into a 250ms average.
 *
 * The timings are **CPU-side**: the backdrop capture and the render-node /
 * uniform work we control. GPU shader execution is not visible from here.
 */
class GlassFrameStatsEvent(
  surfaceId: Int,
  viewId: Int,
  private val drawFps: Double,
  private val totalMs: Double,
  private val maxTotalMs: Double,
  private val captureMs: Double,
  private val shaderMs: Double,
  private val tier: String,
  private val capturedWidth: Int,
  private val capturedHeight: Int,
) : Event<GlassFrameStatsEvent>(surfaceId, viewId) {

  override fun getEventName(): String = EVENT_NAME

  override fun getEventData(): WritableMap = Arguments.createMap().apply {
    putDouble("drawFps", drawFps)
    putDouble("totalMs", totalMs)
    putDouble("maxTotalMs", maxTotalMs)
    putDouble("captureMs", captureMs)
    putDouble("shaderMs", shaderMs)
    putString("tier", tier)
    putInt("capturedWidth", capturedWidth)
    putInt("capturedHeight", capturedHeight)
  }

  companion object {
    const val EVENT_NAME = "topFrameStats"
  }
}
