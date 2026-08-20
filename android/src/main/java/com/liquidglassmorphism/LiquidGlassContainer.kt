package com.liquidglassmorphism

import android.content.Context

/**
 * Cross-view glass merging on Android (the counterpart to iOS 26's
 * `UIGlassContainerEffect`).
 *
 * iOS gets this from the OS: wrap children in a `UIGlassContainerEffect` and
 * overlapping glass fuses. Android has no such effect, so we do what Apple is
 * almost certainly doing under the hood — merge **analytically, in the
 * shader**, from each child's geometry.
 *
 * That is the whole reason this is not built on `secondaryShape`. That path
 * bakes a signed-distance field on the CPU, measured at ~361ms per rebuild, so
 * a child moving costs a rebuild and the result is ~1.6fps. Here each child is
 * a rounded rect the shader smooth-mins per pixel, so a child moving costs a
 * uniform upload. Movement is free; the trade is that bodies must be rounded
 * rects rather than arbitrary silhouettes.
 *
 * The container extends [LiquidGlassmorphismView] rather than wrapping one, so
 * it inherits the entire optical pipeline — backdrop capture, refraction, rim,
 * specular, tint, dispersion — and only has to supply a different distance
 * function. Its glass children are switched to content-only so the merged
 * surface is drawn exactly once.
 */
class LiquidGlassContainer(context: Context) : LiquidGlassmorphismView(context) {

  private var spacingDp = 0f
  private val rects = FloatArray(MAX_BODIES * 4)
  private val radii = FloatArray(MAX_BODIES)

  fun setSpacingValue(value: Float) {
    val v = value.coerceAtLeast(0f)
    if (spacingDp == v) return
    spacingDp = v
    syncBodies()
  }

  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
    super.onLayout(changed, l, t, r, b)
    syncBodies()
  }

  /**
   * Re-read the children every frame, not only on our own layout.
   *
   * A child moving — which is the entire point of an animated merge — lays out
   * the CHILD, not us, so `onLayout` never fires and the merged bodies froze at
   * their first position while everything else animated. Syncing here is a
   * handful of int reads per child, which is nothing next to the capture and
   * shader pass already happening in this same callback.
   */
  override fun onPreDraw(): Boolean {
    syncBodies()
    return super.onPreDraw()
  }

  /**
   * Collect the glass children's geometry and hand it to the shader.
   *
   * Called on layout rather than per frame: a child that animates its position
   * triggers layout anyway, and reading the view tree every frame would be the
   * cost this design exists to avoid.
   */
  private fun syncBodies() {
    var n = 0
    for (i in 0 until childCount) {
      if (n >= MAX_BODIES) break
      val child = getChildAt(i) as? LiquidGlassmorphismView ?: continue
      if (child.width <= 0 || child.height <= 0) continue

      // Centre + half-extents in OUR pixel space, which is what the shader's
      // sdRoundRect expects.
      rects[n * 4] = child.left + child.width * 0.5f
      rects[n * 4 + 1] = child.top + child.height * 0.5f
      rects[n * 4 + 2] = child.width * 0.5f
      rects[n * 4 + 3] = child.height * 0.5f
      radii[n] = child.effectiveCornerRadiusPx(child.width, child.height)

      // The merged surface is ours to draw; theirs would double it.
      child.setGlassSuppressed(spacingDp > 0f)
      n++
    }

    // Merging off: give the children back their own glass rather than leaving
    // a container that renders nothing over invisible children.
    if (spacingDp <= 0f) {
      for (i in 0 until childCount) {
        (getChildAt(i) as? LiquidGlassmorphismView)?.setGlassSuppressed(false)
      }
      setMergedBodies(rects, radii, 0, 0f)
      return
    }

    setMergedBodies(rects, radii, n, spacingDp * resources.displayMetrics.density)
  }
}
