package com.liquidglassmorphism

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sqrt

/**
 * Builds a **signed-distance-field (SDF) texture** from an arbitrary (even
 * concave) [Path], so the AGSL glass shader can treat any silhouette exactly the
 * way it treats the analytic rounded-rect: sample the SDF for the signed
 * distance `d`, take its gradient for the surface normal, and drive lensing,
 * rim, dispersion and the medial-axis seam-fade off both.
 *
 * The silhouette is rasterised (anti-aliased) at a capped resolution, seeded
 * with sub-pixel contour offsets from the coverage, run through an exact
 * Euclidean distance transform (Felzenszwalb & Huttenlocher's O(n) 1-D DT, once
 * per axis), signed by the coverage, and packed as a bitmap where a **16-bit
 * fixed-point** distance spans the red (high byte) and green (low byte)
 * channels:
 *
 *   encoded = 0.5 + d / (2 · range)          (clamped to 0..1, 16-bit)
 *   d       = (decode(sample) − 0.5) · (2 · range)
 *
 * `d < 0` inside the shape, `0` on the edge, `> 0` outside — matching the
 * shader's convention. Distances beyond ±`range` saturate, which is harmless
 * because every glass effect acts within a thin band of the edge.
 */
object GlassSdf {

  /**
   * @param bitmap the distance field (working resolution, ≤[MAX_DIM])
   * @param range  encoded span in view px, square-law: d = u·|u|·range
   *   where u = (r − 0.5)·2
   * @param mask   full-view-resolution coverage of the silhouette. The shader
   *   takes its EDGE ALPHA from this (Skia's anti-aliased path rasterisation —
   *   crisp like a CAShapeLayer mask), and only the optics from the SDF; an
   *   alpha edge derived from the coarse 8-bit SDF wobbles per-texel and reads
   *   as a serrated, broken-glass outline.
   * @param grad  the field's surface-normal texture: R/G = unit gradient
   *   (0.5-centred), B = gradient magnitude (medial-axis confidence). Computed
   *   HERE, in float, from the smoothed field — differentiating the packed
   *   texture in the shader leaves per-texel direction wobble that the ~100px
   *   mirror displacement turns into radial "shattered glass" streaks.
   */
  class Result(val bitmap: Bitmap, val range: Float, val mask: Bitmap, val grad: Bitmap)

  // Cap the working resolution so a full-screen shape stays cheap to transform.
  // 1024 keeps SDF texels ≈1 view px even for a full-width bar, which the
  // shader's normal (finite differences) needs to stay smooth — at 512 a wide
  // shape's normals jitter per-pixel and the refraction reads as shattered.
  private const val MAX_DIM = 1024

  /**
   * Half-width, in texels, of the stencil the surface normal is differenced
   * over. Wide enough that the medial axis fades across a band you can see
   * rather than a hard line; narrow enough to leave the normal untouched
   * everywhere the field is locally linear, which is almost everywhere.
   */
  private const val GRAD_RADIUS = 3
  // Comfortably larger than any squared distance in a ≤1024² grid (~2.1e6) yet
  // small enough to keep float32 precision sharp through the parabola math.
  private const val INF = 1e9f

  /**
   * Generate the SDF for [path] (already scaled into the view's pixel space).
   * Returns null if the size is degenerate.
   */
  fun build(path: Path, viewW: Int, viewH: Int): Result? {
    if (viewW <= 0 || viewH <= 0) return null

    val maxDim = max(viewW, viewH)
    val scale = if (maxDim > MAX_DIM) MAX_DIM.toFloat() / maxDim else 1f
    val w = max(1, (viewW * scale).toInt())
    val h = max(1, (viewH * scale).toInt())

    // Rasterise the coverage mask at working resolution.
    val cov = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(cov)
    val sx = w.toFloat() / viewW
    val sy = h.toFloat() / viewH
    canvas.scale(sx, sy)
    val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      color = Color.WHITE
      style = Paint.Style.FILL
    }
    canvas.drawPath(path, paint)

    val px = IntArray(w * h)
    cov.getPixels(px, 0, w, 0, 0, w, h)
    cov.recycle()

    // ANTI-ALIASED distance seeding (Gustavson & Strand). Seeding the EDT from
    // a binarised mask bakes a pixel staircase into the field: the surface
    // normal then wobbles a few degrees along the edge, and the shader's
    // edge-reflection displacement (tens of px) amplifies that into visible
    // ripples — glass that reads as shattered. Instead, seed every pixel the
    // contour actually passes through with its SUB-PIXEL offset |a − 0.5| (for
    // a locally straight edge the contour sits that far from the pixel centre),
    // run ONE distance transform to the contour, and take the sign from the
    // coverage. Hard (non-partial) staircase steps are seeded at 0.5px.
    val n = w * h
    val alpha = FloatArray(n)
    val seed = FloatArray(n) { INF }
    for (i in 0 until n) alpha[i] = ((px[i] ushr 24) and 0xFF) / 255f
    for (y in 0 until h) {
      for (x in 0 until w) {
        val i = y * w + x
        val a = alpha[i]
        if (a > 0f && a < 1f) {
          val o = a - 0.5f
          seed[i] = o * o
        } else {
          // Fully-covered/empty pixel right on a hard binarised step — the
          // contour is ~0.5px away between the two pixel centres.
          val here = a >= 0.5f
          val stepped =
            (x > 0 && (alpha[i - 1] >= 0.5f) != here) ||
              (x < w - 1 && (alpha[i + 1] >= 0.5f) != here) ||
              (y > 0 && (alpha[i - w] >= 0.5f) != here) ||
              (y < h - 1 && (alpha[i + w] >= 0.5f) != here)
          if (stepped) seed[i] = 0.25f
        }
      }
    }

    val distSq = edt(seed, w, h) // squared distance to the (sub-pixel) contour

    // Smooth the SIGNED distance with a small separable Gaussian. The EDT's
    // coverage-derived seeds carry sub-pixel ripples (the AA staircase phase
    // beats against the pixel grid), and the EDT propagates those ripples to
    // every interior iso-line. Downstream the shader folds the backdrop at the
    // ring where the mirror displacement peaks — a stationary point, so even
    // ±0.2px of ripple wanders the fold wildly and the lens reads as
    // shattered "petals" (the analytic rounded-rect, with its exact SDF, has
    // none of this). Smoothing costs nothing visually: the silhouette's crisp
    // edge comes from the separate full-res mask, not this field.
    val dist = FloatArray(n)
    for (i in 0 until n) {
      val mag = sqrt(distSq[i])
      dist[i] = if (alpha[i] >= 0.5f) -mag else mag
    }
    gaussianBlur(dist, w, h)

    // View-pixels-per-working-pixel (uniform scale, so x and y agree).
    val toView = 1f / scale
    // Encode the distance band the glass effects use (the widest is the lens
    // band at ~0.56·minDim from the edge) in a SINGLE 8-bit channel. This is
    // deliberately the dumbest possible encoding: every clever one failed on
    // real GPU stacks. RGBA_F16 gets quantised to 8-bit by emulator/driver
    // translation layers; a 16-bit high/low byte split tears wherever the low
    // byte wraps, because hardware bilinear blends the bytes independently
    // (FILTER_MODE_NEAREST is not reliably honoured through RenderEffect
    // child sampling). A monotone 8-bit ramp, by contrast, interpolates
    // cleanly under ANY filtering. The ~1px quantisation is fine because the
    // shader only uses d for broad 30–130px band masks — the precision-hungry
    // consumer (the surface normal) ships separately in [grad], computed in
    // float here on the CPU. Distances saturate beyond ±range, which is fine —
    // the interior plateau reads as flat clear glass.
    val range = min(220f, max(48f, min(viewW, viewH) * 0.6f))

    // The two band ramps every optic is built from, precomputed in float.
    // Deriving these in-shader from the 8-bit distance leaves ±½-code ripple,
    // and the mirror fold — where sensitivity to the ramp diverges — magnifies
    // that into rings.
    //
    // Band widths ADAPT to the shape's inradius (deepest interior distance —
    // free from the EDT). Sizing them off the view alone (0.56·minDim) leaves
    // a compact shape with NO flat centre: the whole interior refracts and the
    // mirror fold lands mid-shape as a harsh "eye" — while the same-size
    // analytic rounded-rect keeps a calm clear centre because its bands scale
    // with its corner radius. Capping by the inradius restores that clear
    // centre on every silhouette; wide shapes (the dock) keep their broad
    // liquid bands.
    val minDim = min(viewW, viewH).toFloat()
    var maxInside = 0f
    for (i in 0 until n) {
      val inside = -dist[i]
      if (inside > maxInside) maxInside = inside
    }
    maxInside = max(1f, maxInside * toView)
    // The inradius cap has to stay authoritative. A `max(28, …)` floor outside
    // the `min` silently overrode it on any compact or spiky silhouette: an
    // 84px triangle has an inradius near 20px, so a 28px floor put the whole
    // shape inside the lens band and the mirror band covered most of it too —
    // no calm centre anywhere, which is why small stars and triangles read as
    // milky plastic instead of glass. The floor is now small enough that the
    // cap always wins where it matters.
    // Mirror the analytic path's band multipliers, with the shape's inradius
    // standing in for the rounded rect's corner radius.
    //
    // The analytic circle gets `lensW = cornerRadius * 1.4` and
    // `reflW = minDim * 0.35`. Against `maxInside * 0.75` / `0.55` the SDF band
    // came out roughly half as wide for the same circle, which packs the same
    // displacement into half the distance — twice the gradient. That is the
    // radial sunburst around every custom silhouette: a steep displacement ramp
    // stretches the backdrop along the normal. Matching the multipliers makes
    // the two paths agree.
    val lensW = max(6f, min(minDim * 0.7f, maxInside * 1.4f))
    val reflW = max(4f, min(minDim * 0.35f, maxInside * 0.7f))

    val out = IntArray(n)
    for (i in 0 until n) {
      // Signed by coverage: negative inside the shape, positive outside.
      val signed = dist[i] * toView
      // SQUARE-LAW encoding, not linear. `d` has two very different consumers:
      // broad band masks tens of px wide, and `rimLine`, which needs it
      // accurate across a 3px band at the very edge. A linear ramp over ±220px
      // in 8 bits spends ~1.7px per code, so the whole rim highlight lived
      // inside two codes and came out as the speckled dark ring on every
      // custom shape — while the analytic path, with an exact float distance,
      // draws a clean bright edge. Storing sqrt(|d|) concentrates the codes
      // where the edge is: the first 3px now span ~15 codes instead of 2, and
      // the far field, which only feeds broad masks, gives up precision it
      // never needed.
      val t = min(1f, abs(signed) / range)
      val u = if (signed < 0f) -sqrt(t) else sqrt(t)
      val e = (0.5f + u * 0.5f).coerceIn(0f, 1f)
      // NOT dithered, unlike the ramps below. `d` feeds `edgeGuard`, which
      // ramps over 12px while multiplying a mirror displacement of ~130px —
      // roughly an 11x amplification. Sub-code noise there becomes several
      // pixels of radial sample jitter per output pixel, which is the fine
      // "sunburst" of hairs around every custom silhouette. The square-law
      // encoding already puts sub-pixel steps near the edge, so there is no
      // banding left for dither to break up.
      val v = (e * 255f + 0.5f).toInt().coerceIn(0, 255)
      val rim = 1f - (-signed / lensW).coerceIn(0f, 1f)
      val eb = 1f - (-signed / reflW).coerceIn(0f, 1f)
      val rimQ = (rim * 255f + 0.5f + dither(i * 5 + 3)).toInt().coerceIn(0, 255)
      val ebQ = (eb * 255f + 0.5f + dither(i * 5 + 4)).toInt().coerceIn(0, 255)
      // R = distance, G = lens rim ramp, B = mirror band ramp. Opaque alpha
      // keeps the premultiplied store an identity.
      out[i] = (0xFF shl 24) or (v shl 16) or (rimQ shl 8) or ebQ
    }

    val bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
    bmp.setPixels(out, 0, w, 0, 0, w, h)

    // Surface normals, computed in float from the smoothed field and smoothed
    // again — the shader samples these instead of finite-differencing the
    // packed distance texture (which wobbles a few degrees per texel; the
    // lens/mirror displacement magnifies that into radial streaks).
    // Central differences over a WIDE stencil, not one texel.
    //
    // `dist` is very nearly an exact distance field, so |grad| is ~1 everywhere
    // and collapses only within a texel or two of the medial axis. A 1-texel
    // difference therefore makes both the direction and the confidence flip
    // over essentially no distance — along a polygon's angle bisectors that
    // produced dark, ragged wedges running in from every vertex: in the narrow
    // transition band the confidence sits mid-range (so the lens is still
    // partly on) while the direction is pure noise, and the mirror term throws
    // the sample tens of pixels somewhere arbitrary.
    //
    // Sampling over ±GRAD_RADIUS makes the two sides cancel gradually, so the
    // direction stays stable through the band and the confidence ramps smoothly
    // — the same reasoning as the analytic rounded-rect's epsilon.
    val gx = FloatArray(n)
    val gy = FloatArray(n)
    val r = GRAD_RADIUS
    for (y in 0 until h) {
      for (x in 0 until w) {
        val i = y * w + x
        val xl = dist[y * w + (x - r).coerceAtLeast(0)]
        val xr = dist[y * w + (x + r).coerceAtMost(w - 1)]
        val yu = dist[(y - r).coerceAtLeast(0) * w + x]
        val yd = dist[(y + r).coerceAtMost(h - 1) * w + x]
        // Normalised by the actual span so |grad| stays ~1 on clean slopes.
        gx[i] = (xr - xl) / (2f * r)
        gy[i] = (yd - yu) / (2f * r)
      }
    }
    // Two passes (σ≈1.6): the mirror band displaces by ~iLens·3 px, so it
    // magnifies any residual per-texel wobble in the normal into radial rim
    // streaks. Heavier smoothing of the (slowly-varying) normal costs a shape
    // nothing and buys a clean rim.
    gaussianBlur(gx, w, h); gaussianBlur(gx, w, h)
    gaussianBlur(gy, w, h); gaussianBlur(gy, w, h)
    val gradPx = IntArray(n)
    for (i in 0 until n) {
      val len = sqrt(gx[i] * gx[i] + gy[i] * gy[i])
      val nx = if (len > 1e-4f) gx[i] / len else 0f
      val ny = if (len > 1e-4f) gy[i] / len else 0f
      // |∇d| ≈ 1 on clean slopes, → 0 along the medial axis / saturated
      // plateau — the shader's seam-fade confidence.
      val mag = min(1f, len)
      val r = ((nx * 0.5f + 0.5f) * 255f + 0.5f + dither(i * 3 + 1)).toInt().coerceIn(0, 255)
      val g = ((ny * 0.5f + 0.5f) * 255f + 0.5f + dither(i * 3 + 2)).toInt().coerceIn(0, 255)
      // Dithered like everything else: coherent 8-bit steps in the confidence
      // ring the seam-fade around interior distance maxima (blobs/pills).
      val b = (mag * 255f + 0.5f + dither(i * 3)).toInt().coerceIn(0, 255)
      gradPx[i] = (0xFF shl 24) or (r shl 16) or (g shl 8) or b
    }
    val gradBmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
    gradBmp.setPixels(gradPx, 0, w, 0, 0, w, h)

    return Result(bmp, range, buildMask(path, viewW, viewH), gradBmp)
  }

  // Full-resolution (capped) anti-aliased coverage of the path — the shader's
  // silhouette alpha. ALPHA_8 keeps it a single channel.
  private const val MASK_MAX_DIM = 2048

  private fun buildMask(path: Path, viewW: Int, viewH: Int): Bitmap {
    val maxDim = max(viewW, viewH)
    val s = if (maxDim > MASK_MAX_DIM) MASK_MAX_DIM.toFloat() / maxDim else 1f
    val mw = max(1, (viewW * s).toInt())
    val mh = max(1, (viewH * s).toInt())
    val mask = Bitmap.createBitmap(mw, mh, Bitmap.Config.ALPHA_8)
    val canvas = Canvas(mask)
    canvas.scale(mw.toFloat() / viewW, mh.toFloat() / viewH)
    canvas.drawPath(path, Paint(Paint.ANTI_ALIAS_FLAG).apply {
      color = Color.WHITE
      style = Paint.Style.FILL
    })
    return mask
  }

  // Per-texel dither in [-0.5, 0.5) codes (cheap integer hash). 8-bit
  // quantisation of a slowly-varying field produces COHERENT step iso-lines —
  // concentric rings around the shape's interior distance maxima, radial
  // sectors in the quantised normal angle — which the mirror displacement
  // magnifies into visible ripple. Dithering trades that structured error for
  // sub-code white noise, which the bilinear filter + broad band masks render
  // invisibly.
  private fun dither(seed: Int): Float {
    var h = seed * -0x61c88647
    h = h xor (h ushr 13)
    h *= -0x3361d2af
    h = h xor (h ushr 16)
    return ((h and 0xFFFF).toFloat() / 65536f) - 0.5f
  }

  // 5-tap separable Gaussian (σ≈1.1 texels), in place. Wide enough to kill the
  // per-texel seeding ripple, narrow enough (<0.5px geometric drift) to leave
  // the field's shape untouched.
  private val GAUSS = floatArrayOf(0.0614f, 0.2448f, 0.3876f, 0.2448f, 0.0614f)

  private fun gaussianBlur(d: FloatArray, w: Int, h: Int) {
    val tmp = FloatArray(d.size)
    // Horizontal
    for (y in 0 until h) {
      val row = y * w
      for (x in 0 until w) {
        var acc = 0f
        for (k in -2..2) {
          val xx = (x + k).coerceIn(0, w - 1)
          acc += d[row + xx] * GAUSS[k + 2]
        }
        tmp[row + x] = acc
      }
    }
    // Vertical
    for (y in 0 until h) {
      for (x in 0 until w) {
        var acc = 0f
        for (k in -2..2) {
          val yy = (y + k).coerceIn(0, h - 1)
          acc += tmp[yy * w + x] * GAUSS[k + 2]
        }
        d[y * w + x] = acc
      }
    }
  }

  /**
   * Exact squared-Euclidean distance transform of a 2-D grid: `f[i]` is 0 at a
   * seed and [INF] elsewhere; returns the squared distance to the nearest seed.
   * Runs the 1-D transform down every column, then across every row.
   */
  private fun edt(f: FloatArray, w: Int, h: Int): FloatArray {
    val d = f.copyOf()
    val col = FloatArray(h)
    for (x in 0 until w) {
      for (y in 0 until h) col[y] = d[y * w + x]
      val dd = dt1d(col, h)
      for (y in 0 until h) d[y * w + x] = dd[y]
    }
    val row = FloatArray(w)
    for (y in 0 until h) {
      for (x in 0 until w) row[x] = d[y * w + x]
      val dd = dt1d(row, w)
      for (x in 0 until w) d[y * w + x] = dd[x]
    }
    return d
  }

  /** Felzenszwalb & Huttenlocher 1-D squared-distance transform, O(n). */
  private fun dt1d(f: FloatArray, n: Int): FloatArray {
    val d = FloatArray(n)
    val v = IntArray(n)
    val z = FloatArray(n + 1)
    var k = 0
    v[0] = 0
    z[0] = -INF
    z[1] = INF
    for (q in 1 until n) {
      var s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2f * q - 2f * v[k])
      while (s <= z[k]) {
        k--
        s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2f * q - 2f * v[k])
      }
      k++
      v[k] = q
      z[k] = s
      z[k + 1] = INF
    }
    k = 0
    for (q in 0 until n) {
      while (z[k + 1] < q) k++
      val dx = (q - v[k]).toFloat()
      d[q] = dx * dx + f[v[k]]
    }
    return d
  }
}
