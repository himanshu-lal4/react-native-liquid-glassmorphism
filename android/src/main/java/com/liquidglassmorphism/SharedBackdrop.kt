package com.liquidglassmorphism

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.view.View
import java.util.WeakHashMap

/**
 * One backdrop capture per root, per frame, shared by every glass view under it.
 *
 * Each glass view used to run its own full software `rootView.draw(canvas)` on
 * every `onPreDraw`. That is the single most expensive thing the library does,
 * and it scaled linearly: N glass views meant N full-root software draws and N
 * full-size ARGB_8888 bitmaps per frame. It is what stood between us and a
 * scrolling list of glass cards.
 *
 * Now the first view to reach `onPreDraw` in a given frame captures the whole
 * root once, and everyone else reads the same bitmap. Views differ only in
 * which sub-rectangle of it they sample, which they already had to compute.
 *
 * **Behaviour change worth knowing:** the shared capture excludes *every* glass
 * view, not just the one doing the capturing. It has to — a shared bitmap
 * cannot simultaneously exclude view A for A's benefit and include it for B's.
 * Previously a glass view appeared inside another glass view's backdrop; now it
 * does not. For a single glass view on screen the result is byte-identical to
 * before, which is the case the acceptance criteria pin down.
 */
internal class SharedBackdrop(private val scale: Int) {

  var bitmap: Bitmap? = null
    private set

  private var canvas: Canvas? = null

  /**
   * The frame this bitmap was captured for.
   *
   * `View.getDrawingTime()` is stable across every view drawn in the same
   * frame, which is exactly the "capture once per frame" token we need without
   * hooking Choreographer.
   */
  private var capturedFrame = -1L

  /** Live glass views under this root. The bitmap dies with the last one. */
  var refCount = 0

  /**
   * Capture the root, unless this frame's capture already happened.
   *
   * @return `null` on success (or a no-op), or the throwable if a view behind
   *   the glass refused a software draw — the caller reports that, because the
   *   error is per-view even though the capture is shared.
   */
  fun captureIfNeeded(root: View, frame: Long): Throwable? {
    if (frame == capturedFrame) return null

    val w = root.width / scale
    val h = root.height / scale
    if (w <= 0 || h <= 0) return null

    var bmp = bitmap
    if (bmp == null || bmp.width != w || bmp.height != h) {
      bmp?.recycle()
      bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
      bitmap = bmp
      canvas = Canvas(bmp)
    }
    val c = canvas ?: return null

    // Mark the frame before drawing, not after: if the draw throws, we still do
    // not want every other view under this root retrying the same failing
    // capture in the same frame.
    capturedFrame = frame

    bmp.eraseColor(Color.TRANSPARENT)
    c.save()
    val s = 1f / scale
    c.scale(s, s)
    capturing = true
    return try {
      root.draw(c)
      null
    } catch (t: Throwable) {
      t
    } finally {
      capturing = false
      c.restore()
    }
  }

  /** Drop the held frame so the next `captureIfNeeded` really captures. */
  fun invalidateFrame() {
    capturedFrame = -1L
  }

  private fun dispose() {
    bitmap?.recycle()
    bitmap = null
    canvas = null
    capturedFrame = -1L
  }

  companion object {
    /**
     * True while a shared capture is traversing the hierarchy.
     *
     * Every glass view short-circuits its `draw` on this, so none of them end
     * up inside the backdrop — which would otherwise be a feedback loop for the
     * capturing view and glass-on-glass for the others.
     *
     * A plain flag rather than per-view state because the capture is now a
     * property of the root, not of whichever view happened to trigger it.
     */
    @JvmStatic
    @Volatile
    var capturing = false
      private set

    private val byRoot = WeakHashMap<View, SharedBackdrop>()

    @Synchronized
    fun acquire(root: View, scale: Int): SharedBackdrop {
      val existing = byRoot[root]
      val cap = existing ?: SharedBackdrop(scale).also { byRoot[root] = it }
      cap.refCount++
      return cap
    }

    @Synchronized
    fun release(root: View?, cap: SharedBackdrop?) {
      if (cap == null) return
      cap.refCount--
      if (cap.refCount > 0) return
      // Last glass view under this root went away — free the bitmap rather than
      // leaving a full-screen ARGB_8888 alive for a screen nobody is on.
      if (root != null) byRoot.remove(root)
      cap.dispose()
    }
  }
}
