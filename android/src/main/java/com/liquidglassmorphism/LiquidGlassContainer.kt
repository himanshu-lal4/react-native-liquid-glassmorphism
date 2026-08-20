package com.liquidglassmorphism

import android.content.Context
import android.view.View
import android.view.ViewGroup

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
  private val locSelf = IntArray(2)
  private val locChild = IntArray(2)

  /**
   * Collect every glass DESCENDANT's on-screen geometry and hand it to the
   * shader.
   *
   * Two things this deliberately does not do, both learned the hard way:
   *
   * It does not stop at direct children. Real layouts wrap a glass view in an
   * `Animated.View`, a `Pressable`, or both, so a direct-children-only walk
   * finds the wrappers and merges nothing.
   *
   * It does not read `left`/`top`. A view animated by TRANSFORM never changes
   * its layout bounds — `left` is wherever it was laid out, forever — so
   * reading them merges bodies that are visibly somewhere else, or worse,
   * freezes them while everything around them moves.
   * `getLocationInWindow` reports where the view actually is, transforms of
   * every ancestor included, which is the only thing the shader can use.
   */
  private val found = ArrayList<LiquidGlassmorphismView>(MAX_BODIES * 2)
  private var warnedTruncated = false

  private fun syncBodies() {
    found.clear()
    forEachGlassDescendant { found.add(it) }

    if (spacingDp <= 0f) {
      for (v in found) v.setGlassSuppressed(false)
      setMergedBodies(rects, radii, 0, 0f)
      return
    }

    getLocationInWindow(locSelf)
    var n = 0
    var adopted = false

    for (child in found) {
      // Past the cap, or degenerate: this child keeps drawing its OWN glass.
      // Leaving it suppressed would make it vanish, which is far worse than
      // it simply not merging — and a child can cross the cap boundary just
      // by another one mounting.
      if (n >= MAX_BODIES || child.width <= 0 || child.height <= 0) {
        child.setGlassSuppressed(false)
        continue
      }

      child.getLocationInWindow(locChild)
      val w = child.width * child.scaleX
      val h = child.height * child.scaleY

      rects[n * 4] = (locChild[0] - locSelf[0]) + w * 0.5f
      rects[n * 4 + 1] = (locChild[1] - locSelf[1]) + h * 0.5f
      rects[n * 4 + 2] = w * 0.5f
      rects[n * 4 + 3] = h * 0.5f
      radii[n] = child.effectiveCornerRadiusPx(child.width, child.height) * child.scaleX

      if (!adopted) { adoptMaterialFrom(child); adopted = true }
      child.setGlassSuppressed(true)
      n++
    }

    if (found.size > MAX_BODIES && !warnedTruncated) {
      warnedTruncated = true
      android.util.Log.w(
        "LiquidGlass",
        "LiquidGlassContainer has ${found.size} glass children but can merge at " +
          "most $MAX_BODIES (the AGSL uniform array needs a compile-time bound). " +
          "The rest render as ordinary unmerged glass."
      )
    }

    setMergedBodies(rects, radii, n, spacingDp * resources.displayMetrics.density)
  }

  /**
   * Hand the children back their own glass.
   *
   * Without this a container being removed leaves every child it had
   * suppressed — drawing content but no glass — for as long as those views
   * live. Detach is the last moment we can still reach them.
   */
  override fun onDetachedFromWindow() {
    found.clear()
    forEachGlassDescendant { found.add(it) }
    for (v in found) v.setGlassSuppressed(false)
    found.clear()
    super.onDetachedFromWindow()
  }

  /** Depth-first walk, skipping our own merged surface. */
  private fun forEachGlassDescendant(action: (LiquidGlassmorphismView) -> Unit) {
    fun walk(v: View) {
      if (v !== this && v is LiquidGlassmorphismView) {
        action(v)
        // Do not descend into a glass view: its children are content, and a
        // nested container owns its own merge.
        return
      }
      if (v is ViewGroup) {
        for (i in 0 until v.childCount) walk(v.getChildAt(i))
      }
    }
    for (i in 0 until childCount) walk(getChildAt(i))
  }

}
