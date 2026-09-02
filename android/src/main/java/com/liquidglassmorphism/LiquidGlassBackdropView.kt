package com.liquidglassmorphism

import android.content.Context
import android.graphics.Canvas
import android.graphics.RenderNode
import android.os.Build
import android.view.View
import android.view.ViewGroup
import com.facebook.react.views.view.ReactViewGroup

/**
 * A GPU backdrop for the glass views inside it.
 *
 * The default glass pipeline captures the whole window into a bitmap with a
 * software `root.draw()` once per frame — the single most expensive thing the
 * library does, and the thing that scales with screen size rather than with
 * the glass. This view is the way out. It records its own children into a
 * [RenderNode] (a GPU display list, nothing is rasterised on the CPU) and
 * every glass view inside it draws that node into its effect layer instead of
 * a bitmap. Scrolling content under the glass then costs nothing on our side:
 * the display list already points at the live content.
 *
 * Because the glass is composited by this view rather than by its own place in
 * the tree, two things become possible that the bitmap path rules out:
 *
 *  - **Glass on glass.** Each glass view samples a composite of the backdrop
 *    plus every glass drawn before it, so a glass slider on a glass sheet sees
 *    the sheet, not the wallpaper behind both.
 *  - **Transforms.** The backdrop is drawn through the inverse of the glass
 *    view's transform, so a press-scaled or rotated pane keeps the world behind
 *    it still — the glass moves, what it shows does not.
 *
 * The trade is z-order: glass inside a backdrop composites above every
 * non-glass sibling in it, in tree order. Overlays that must sit above the
 * glass belong outside the backdrop.
 *
 * How a frame goes (see [dispatchDraw]):
 *
 *  1. Record the children into the backdrop node with [recording] set, which
 *     makes every glass view draw nothing — glass must not be in its own
 *     backdrop.
 *  2. Walk the subtree for glass views, in tree order.
 *  3. For each, record a composite node = the previous composite + that glass,
 *     drawn inline through its ancestor chain's transforms and clips. The
 *     glass samples the previous composite, so no node ever references itself.
 *  4. Draw the last composite.
 *
 * Below API 29 there is no public RenderNode; the view is then a plain
 * container and the glass inside it uses the bitmap capture as usual.
 */
class LiquidGlassBackdropView(context: Context) : ReactViewGroup(context) {

  /** True while the children are being recorded into the backdrop node. */
  var recording = false
    private set

  /**
   * True once this view has composited a frame through the layer path. Glass
   * views read it to know they can skip the software capture.
   */
  var layerActive = false
    private set

  private val backdropNode: RenderNode? =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) RenderNode("liquidGlassBackdrop") else null
  private val composites = ArrayList<RenderNode>()
  private val glassViews = ArrayList<LiquidGlassmorphismView>()
  private val chain = ArrayList<View>()

  override fun dispatchDraw(canvas: Canvas) {
    val node = backdropNode
    if (node == null || !canvas.isHardwareAccelerated || width <= 0 || height <= 0) {
      // A software pass. The shared bitmap capture is one (glass views outside
      // us draw the whole window into a bitmap every frame) and says nothing
      // about our on-screen mode, so it must leave the layer state alone —
      // flipping it there let glass views record real content into their own
      // display lists between two composited frames, which is how a node ends
      // up inside its own backdrop. Any OTHER software draw (a view snapshot,
      // say) does drop us out of layer mode: the glass views' own display
      // lists were left empty on purpose, so they must be told to re-record,
      // and so must we, to composite again on the next hardware frame.
      if (layerActive && !SharedBackdrop.capturing) {
        layerActive = false
        glassViews.clear()
        collectGlass(this)
        for (g in glassViews) g.invalidate()
        invalidate()
      }
      super.dispatchDraw(canvas)
      return
    }

    // 1. Everything except the glass.
    node.setPosition(0, 0, width, height)
    recording = true
    val rc = node.beginRecording()
    try {
      super.dispatchDraw(rc)
    } finally {
      node.endRecording()
      recording = false
    }
    layerActive = true

    // 2. The glass, in tree order — nested glass included, since a glass view
    // drawn through its own display list would be the empty one recorded in
    // step 1. Every glass is drawn explicitly here.
    glassViews.clear()
    collectGlass(this)

    // 3. Composite chain.
    var below: RenderNode = node
    for (i in glassViews.indices) {
      val glass = glassViews[i]
      val comp = compositeAt(i)
      comp.setPosition(0, 0, width, height)
      val cc = comp.beginRecording()
      try {
        cc.drawRenderNode(below)
        if (glass.visibility == View.VISIBLE && buildChain(glass)) {
          glass.backdropBelow = below
          cc.save()
          try {
            // Descend host → glass, applying each level's placement, transform
            // and (where it clips) bounds — so a card scrolled out of its
            // ScrollView is clipped exactly as it would be in the tree.
            for (v in chain) {
              val parent = v.parent as ViewGroup
              cc.translate(
                (v.left - parent.scrollX).toFloat(),
                (v.top - parent.scrollY).toFloat()
              )
              if (!v.matrix.isIdentity) cc.concat(v.matrix)
              if (v !== glass && clipsChildren(v)) {
                cc.clipRect(0f, 0f, v.width.toFloat(), v.height.toFloat())
              }
            }
            glass.drawingFromHost = true
            try {
              glass.draw(cc)
            } finally {
              glass.drawingFromHost = false
            }
          } finally {
            cc.restore()
          }
        }
      } finally {
        comp.endRecording()
      }
      below = comp
    }
    // Composites past the glass count are stale; drop them so a glass that
    // unmounts does not keep its last frame alive in a node nobody draws.
    while (composites.size > glassViews.size) {
      composites.removeAt(composites.size - 1).discardDisplayList()
    }

    canvas.drawRenderNode(below)
  }

  private fun compositeAt(i: Int): RenderNode {
    while (composites.size <= i) composites.add(RenderNode("liquidGlassComposite"))
    return composites[i]
  }

  /** Depth-first, in draw order; descends into glass too. */
  private fun collectGlass(group: ViewGroup) {
    for (i in 0 until group.childCount) {
      val child = group.getChildAt(i)
      if (child is LiquidGlassmorphismView) glassViews.add(child)
      if (child is ViewGroup) collectGlass(child)
    }
  }

  /**
   * The views from this backdrop's direct child down to [glass], inclusive.
   * False if the glass is not (or no longer) inside this view.
   */
  private fun buildChain(glass: View): Boolean {
    chain.clear()
    var v: View? = glass
    while (v != null && v !== this) {
      chain.add(v)
      v = v.parent as? View
    }
    if (v !== this) {
      chain.clear()
      return false
    }
    chain.reverse()
    return true
  }

  private fun clipsChildren(v: View): Boolean {
    if (v !is ViewGroup) return false
    if (v.clipChildren) return true
    // React Native expresses `overflow: hidden` on its own group rather than
    // through clipChildren.
    return v is ReactViewGroup && v.overflow != null && v.overflow != "visible"
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    layerActive = false
    for (c in composites) c.discardDisplayList()
    composites.clear()
    backdropNode?.discardDisplayList()
  }
}
