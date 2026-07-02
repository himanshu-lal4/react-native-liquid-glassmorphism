package com.liquidglassmorphism

/**
 * Pure, framework-free helpers that translate the public Liquid Glass props
 * (intensity / variant / tintColor) into the concrete numbers the renderer
 * needs (blur radius in px, resolved ARGB tint, specular strength).
 *
 * Kept free of any Android imports so it can be unit-tested on the plain JVM
 * (see `src/test/.../GlassParamsTest.kt`). The [LiquidGlassmorphismView] feeds
 * these results into RenderEffect / AGSL.
 */
object GlassParams {

  /** Clamp a raw `intensity` prop into the documented 0–100 range. */
  fun clampIntensity(intensity: Int): Int = intensity.coerceIn(0, 100)

  /**
   * Blur radius in pixels for the frosted backdrop.
   *
   * Intensity 0→100 maps onto a [MIN_BLUR_DP]→[MAX_BLUR_DP] ramp; the `clear`
   * variant is lighter ([CLEAR_BLUR_SCALE]× ) so media reads through it. Always
   * strictly positive — `RenderEffect.createBlurEffect` rejects a radius of 0.
   */
  fun blurRadiusPx(intensity: Int, isClear: Boolean, density: Float): Float {
    val t = clampIntensity(intensity) / 100f
    var dp = MIN_BLUR_DP + t * (MAX_BLUR_DP - MIN_BLUR_DP)
    if (isClear) dp *= CLEAR_BLUR_SCALE
    return (dp * density).coerceAtLeast(0.5f)
  }

  /**
   * Resolve the tint to paint over the blurred backdrop.
   *
   * An explicit, non-transparent `tintColor` wins outright. Otherwise we fall
   * back to a subtle white wash (lighter for `clear`) so a bare
   * `<LiquidGlassView>` still reads as glass — mirroring the iOS default.
   */
  fun resolveTintArgb(tintColor: Int?, isClear: Boolean): Int {
    if (tintColor != null && alphaOf(tintColor) > 0) return tintColor
    val alpha = if (isClear) DEFAULT_CLEAR_TINT_ALPHA else DEFAULT_REGULAR_TINT_ALPHA
    return argb(alpha, 0xFF, 0xFF, 0xFF)
  }

  /**
   * Opacity of the milky white "frost floor" painted over the blurred backdrop,
   * 0–1. This is what makes iOS `regular` glass read as bright frosted milk even
   * over dark content (the material lightens the backdrop); `clear` keeps almost
   * none so media reads through. Drawn *under* the tint.
   */
  fun frostFloorAlpha(isClear: Boolean): Float =
    if (isClear) 0.0f else 0.10f

  /**
   * Extra frost lift applied in proportion to how dark the backdrop is, 0–1.
   * This is what makes iOS `regular` glass "adaptive" — it lightens dark
   * content a lot while staying translucent over bright media. `clear` gets
   * only a little so media still reads through.
   */
  fun adaptiveLift(isClear: Boolean): Float =
    if (isClear) 0.03f else 0.30f

  /** Opacity of the moving specular sheen, 0–1. Subtler on `clear` glass. */
  fun specularAlpha(isClear: Boolean): Float =
    if (isClear) 0.18f else 0.32f

  // --- ARGB helpers (so we needn't import android.graphics.Color in tests) ---

  fun alphaOf(color: Int): Int = (color ushr 24) and 0xFF

  fun argb(a: Int, r: Int, g: Int, b: Int): Int =
    ((a and 0xFF) shl 24) or ((r and 0xFF) shl 16) or ((g and 0xFF) shl 8) or (b and 0xFF)

  /**
   * Edge refraction displacement in pixels — how far the backdrop is bent at
   * the rim of the glass lozenge. This is the LENS strength; it's what makes
   * the content visibly wrap the edges (Liquid Glass), rather than just sit
   * blurred behind (glassmorphism). `clear` bends a little more (thinner, more
   * lens-like); the `refraction` prop dials it up further.
   */
  fun lensStrengthPx(isClear: Boolean, refraction: Boolean, density: Float): Float {
    // Gentle — iOS refracts content only subtly at the rim and stays readable
    // through the centre. A large displacement stretches/smears content
    // (especially on short shapes) and reads as a defect, not glass.
    val baseDp = if (isClear) 11f else 9f
    val k = if (refraction) 1.35f else 1.0f
    return baseDp * k * density
  }

  // Liquid Glass is refraction-dominant, so the frost blur is deliberately
  // LIGHT — heavy blur destroys the detail the lens needs to bend.
  private const val MIN_BLUR_DP = 3f
  private const val MAX_BLUR_DP = 12f
  // `clear` glass is nearly un-frosted — iOS clear is basically transparent
  // refractive glass, so it gets only a whisper of blur.
  private const val CLEAR_BLUR_SCALE = 0.2f
  private const val DEFAULT_REGULAR_TINT_ALPHA = 0x1F // ~12%
  private const val DEFAULT_CLEAR_TINT_ALPHA = 0x0D // ~5%
}
