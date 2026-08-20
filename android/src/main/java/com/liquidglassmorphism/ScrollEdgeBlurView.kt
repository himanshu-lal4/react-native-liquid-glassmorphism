package com.liquidglassmorphism

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.PorterDuff
import android.graphics.PorterDuffXfermode
import android.graphics.Rect
import android.graphics.RenderEffect
import android.graphics.RenderNode
import android.graphics.Shader
import android.os.Build
import android.view.View
import android.view.ViewTreeObserver

/**
 * A progressive edge blur for content scrolling under a header or tab bar (#48).
 *
 * Deliberately a second component rather than a mode on [LiquidGlassmorphismView]:
 * it has no children, no silhouette, no tint and no interaction, so sharing
 * that view's prop surface would mean documenting that most of it does nothing.
 *
 * It reads the same per-root backdrop capture the glass views share (#38), so
 * adding one to a screen that already has glass costs no extra `root.draw()`.
 *
 * The ramp is an **opacity** ramp over a single blurred layer, not a true
 * per-pixel radius ramp. Stacking N blurs at N radii would be closer to what
 * iOS 26 does natively, at N times the cost; at these radii the difference is
 * not visible against real content, and this keeps one render node per view.
 */
class ScrollEdgeBlurView(context: Context) : View(context),
  ViewTreeObserver.OnPreDrawListener {

  private var edge = "top"
  private var maxBlurRadiusDp = 24f
  private var falloff = 1f

  private var shared: SharedBackdrop? = null
  private var sharedRoot: View? = null

  private val density = resources.displayMetrics.density
  private val srcRect = Rect()
  private val dstRect = Rect()
  private val locThis = IntArray(2)
  private val locRoot = IntArray(2)
  private val maskPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
    xfermode = PorterDuffXfermode(PorterDuff.Mode.DST_IN)
  }

  private val node: RenderNode? =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) RenderNode("scrollEdgeBlur") else null

  init {
    // No children and nothing of our own to draw unless we opt in.
    setWillNotDraw(false)
  }

  fun setEdgeValue(value: String?) {
    val v = when (value) {
      "bottom", "left", "right" -> value
      else -> "top"
    }
    if (edge != v) { edge = v; invalidate() }
  }

  fun setMaxBlurRadiusValue(value: Float) {
    val v = value.coerceIn(0f, 60f)
    if (maxBlurRadiusDp != v) { maxBlurRadiusDp = v; invalidate() }
  }

  fun setFalloffValue(value: Float) {
    val v = value.coerceIn(0.05f, 1f)
    if (falloff != v) { falloff = v; invalidate() }
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    val root = rootView
    if (root != null) {
      sharedRoot = root
      shared = SharedBackdrop.acquire(root, CAPTURE_SCALE)
    }
    viewTreeObserver.addOnPreDrawListener(this)
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    viewTreeObserver.removeOnPreDrawListener(this)
    SharedBackdrop.release(sharedRoot, shared)
    shared = null
    sharedRoot = null
  }

  override fun onPreDraw(): Boolean {
    if (SharedBackdrop.capturing || width == 0 || height == 0) return true
    val root = rootView ?: return true
    // No-ops for every view after the first in a given frame.
    shared?.captureIfNeeded(root, root.drawingTime)
    invalidate()
    return true
  }

  /** This view's rectangle inside the shared, root-sized backdrop bitmap. */
  private fun sharedSrcRect(bw: Int, bh: Int, out: Rect): Boolean {
    val root = rootView ?: return false
    getLocationInWindow(locThis)
    root.getLocationInWindow(locRoot)
    val left = (locThis[0] - locRoot[0]) / CAPTURE_SCALE
    val top = (locThis[1] - locRoot[1]) / CAPTURE_SCALE
    val right = left + width / CAPTURE_SCALE
    val bottom = top + height / CAPTURE_SCALE
    if (right <= 0 || bottom <= 0 || left >= bw || top >= bh) return false
    out.set(left.coerceIn(0, bw), top.coerceIn(0, bh), right.coerceIn(0, bw), bottom.coerceIn(0, bh))
    return out.width() > 0 && out.height() > 0
  }

  /** Opaque at the anchored edge, transparent once `falloff` is spent. */
  private fun buildMask(): LinearGradient {
    val w = width.toFloat()
    val h = height.toFloat()
    val f = falloff.coerceIn(0.05f, 1f)
    val (x0, y0, x1, y1) = when (edge) {
      "bottom" -> listOf(0f, h, 0f, h - h * f)
      "left" -> listOf(0f, 0f, w * f, 0f)
      "right" -> listOf(w, 0f, w - w * f, 0f)
      else -> listOf(0f, 0f, 0f, h * f)
    }
    return LinearGradient(
      x0, y0, x1, y1,
      Color.WHITE, Color.TRANSPARENT,
      Shader.TileMode.CLAMP
    )
  }

  private operator fun <T> List<T>.component4(): T = this[3]

  override fun onDraw(canvas: Canvas) {
    super.onDraw(canvas)
    val bmp = shared?.bitmap ?: return
    val rn = node ?: return
    if (bmp.isRecycled || !canvas.isHardwareAccelerated) return
    if (width <= 0 || height <= 0 || maxBlurRadiusDp <= 0f) return
    if (!sharedSrcRect(bmp.width, bmp.height, srcRect)) return

    rn.setPosition(0, 0, width, height)
    val rec = rn.beginRecording()
    dstRect.set(0, 0, width, height)
    rec.drawBitmap(bmp, srcRect, dstRect, null)
    rn.endRecording()

    val r = maxBlurRadiusDp * density
    rn.setRenderEffect(RenderEffect.createBlurEffect(r, r, Shader.TileMode.CLAMP))

    // The blurred backdrop is drawn into an offscreen layer, then the gradient
    // eats its alpha with DST_IN. Doing it in a layer is what lets the fade
    // apply to the composite rather than to each pixel of the source.
    val save = canvas.saveLayer(0f, 0f, width.toFloat(), height.toFloat(), null)
    canvas.drawRenderNode(rn)
    maskPaint.shader = buildMask()
    canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), maskPaint)
    canvas.restoreToCount(save)
  }

  companion object {
    /** Matches LiquidGlassmorphismView so both share one capture. */
    private const val CAPTURE_SCALE = 2
  }
}
