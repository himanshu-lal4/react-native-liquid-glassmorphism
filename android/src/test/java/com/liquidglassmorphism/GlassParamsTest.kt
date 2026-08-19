package com.liquidglassmorphism

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Unit tests for the pure prop->renderer math. Runs on the plain JVM via
 * `:react-native-liquid-glassmorphism:testDebugUnitTest`.
 */
class GlassParamsTest {

  @Test
  fun clampIntensity_coercesIntoRange() {
    assertEquals(0, GlassParams.clampIntensity(-20))
    assertEquals(0, GlassParams.clampIntensity(0))
    assertEquals(60, GlassParams.clampIntensity(60))
    assertEquals(100, GlassParams.clampIntensity(100))
    assertEquals(100, GlassParams.clampIntensity(150))
  }

  @Test
  fun blurRadius_isAlwaysPositive_evenAtZeroIntensity() {
    assertTrue(GlassParams.blurRadiusPx(0, isClear = false, density = 1f) > 0f)
    assertTrue(GlassParams.blurRadiusPx(0, isClear = true, density = 3f) > 0f)
  }

  @Test
  fun blurRadius_increasesWithIntensity() {
    val low = GlassParams.blurRadiusPx(20, isClear = false, density = 2f)
    val high = GlassParams.blurRadiusPx(80, isClear = false, density = 2f)
    assertTrue("expected $high > $low", high > low)
  }

  @Test
  fun blurRadius_scalesWithDensity() {
    val oneX = GlassParams.blurRadiusPx(60, isClear = false, density = 1f)
    val threeX = GlassParams.blurRadiusPx(60, isClear = false, density = 3f)
    assertEquals(oneX * 3f, threeX, 0.001f)
  }

  @Test
  fun blurRadius_clearIsLighterThanRegular() {
    val regular = GlassParams.blurRadiusPx(70, isClear = false, density = 2f)
    val clear = GlassParams.blurRadiusPx(70, isClear = true, density = 2f)
    assertTrue("expected clear $clear < regular $regular", clear < regular)
  }

  /**
   * `clear` stays lightly blurred by design — measured against iOS 26, which
   * lets ~94% of backdrop detail through. `intensity` still moves it, but it is
   * deliberately a narrow ramp; `blurRadius` is the control for anything more.
   *
   * The guard here is that the default stays in the neighbourhood the
   * measurement put it in, so a future tweak cannot quietly drift `clear` back
   * to the heavy blur that made it look nothing like iOS.
   */
  @Test
  fun blurRadius_clearStaysLightAndMonotonic() {
    val low = GlassParams.blurRadiusPx(0, isClear = true, density = 3f)
    val high = GlassParams.blurRadiusPx(100, isClear = true, density = 3f)
    assertTrue("expected clear blur to grow with intensity", high > low)

    val defaultDp = GlassParams.blurRadiusPx(60, isClear = true, density = 3f) / 3f
    assertTrue(
      "clear at the default intensity should stay light (was ${defaultDp}dp)",
      defaultDp in 1f..3f
    )
  }

  /**
   * …and `blurRadius` is what actually spans a usable range, on either
   * variant. This is the control the "clear has no blur" reports were asking
   * for.
   */
  @Test
  fun blurRadius_explicitSpansAWideRange() {
    val none = GlassParams.blurRadiusPx(60, isClear = true, density = 3f, blurRadiusDp = 0f)
    val heavy = GlassParams.blurRadiusPx(60, isClear = true, density = 3f, blurRadiusDp = 24f)
    assertEquals(72f, heavy, 0.001f)
    assertTrue("explicit 0 should be far lighter than explicit 24", heavy > none * 20f)
  }

  @Test
  fun blurRadius_explicitOverrideWinsOverIntensity() {
    val derived = GlassParams.blurRadiusPx(100, isClear = false, density = 2f)
    val explicit = GlassParams.blurRadiusPx(100, isClear = false, density = 2f, blurRadiusDp = 4f)
    assertEquals(8f, explicit, 0.001f)
    assertTrue("override should not equal the derived value here", explicit != derived)
  }

  @Test
  fun blurRadius_explicitOverrideIsVariantIndependent() {
    val regular = GlassParams.blurRadiusPx(60, isClear = false, density = 2f, blurRadiusDp = 10f)
    val clear = GlassParams.blurRadiusPx(60, isClear = true, density = 2f, blurRadiusDp = 10f)
    assertEquals("an explicit radius means the same thing on both variants", regular, clear, 0.001f)
  }

  @Test
  fun blurRadius_negativeOverrideMeansDeriveFromIntensity() {
    val sentinel = GlassParams.blurRadiusPx(
      60, isClear = true, density = 2f, blurRadiusDp = GlassParams.UNSET_BLUR_DP
    )
    val derived = GlassParams.blurRadiusPx(60, isClear = true, density = 2f)
    assertEquals(derived, sentinel, 0.001f)
  }

  @Test
  fun blurRadius_explicitZeroStaysPositive() {
    // RenderEffect.createBlurEffect rejects a radius of 0.
    assertTrue(GlassParams.blurRadiusPx(60, isClear = false, density = 3f, blurRadiusDp = 0f) > 0f)
  }

  @Test
  fun resolveTint_prefersExplicitColor() {
    val explicit = GlassParams.argb(0x80, 0x0A, 0x84, 0xFF) // translucent blue
    assertEquals(explicit, GlassParams.resolveTintArgb(explicit, isClear = false))
  }

  @Test
  fun resolveTint_fallsBackToWhiteWashWhenNull() {
    val regular = GlassParams.resolveTintArgb(null, isClear = false)
    val clear = GlassParams.resolveTintArgb(null, isClear = true)
    // White RGB in both cases.
    assertEquals(0xFF, (regular shr 16) and 0xFF)
    assertEquals(0xFF, (regular shr 8) and 0xFF)
    assertEquals(0xFF, regular and 0xFF)
    // Clear is more transparent than regular.
    assertTrue(GlassParams.alphaOf(clear) < GlassParams.alphaOf(regular))
  }

  @Test
  fun resolveTint_fullyTransparentExplicitFallsBackToWash() {
    val transparent = GlassParams.argb(0x00, 0xFF, 0x00, 0x00)
    val resolved = GlassParams.resolveTintArgb(transparent, isClear = false)
    assertTrue("wash should be visible", GlassParams.alphaOf(resolved) > 0)
  }

  @Test
  fun specularAlpha_clearIsSubtlerThanRegular() {
    assertTrue(GlassParams.specularAlpha(isClear = true) < GlassParams.specularAlpha(isClear = false))
  }

  @Test
  fun lensStrength_isPositive_scalesWithDensity_andRefractionBoostsIt() {
    val base = GlassParams.lensStrengthPx(isClear = false, refraction = false, density = 2f)
    val boosted = GlassParams.lensStrengthPx(isClear = false, refraction = true, density = 2f)
    assertTrue("lens should always displace", base > 0f)
    assertTrue("refraction prop should increase lensing", boosted > base)
    // Linear in density.
    val oneX = GlassParams.lensStrengthPx(isClear = false, refraction = false, density = 1f)
    val threeX = GlassParams.lensStrengthPx(isClear = false, refraction = false, density = 3f)
    assertEquals(oneX * 3f, threeX, 0.001f)
  }

  @Test
  fun frostFloor_regularIsMilkierThanClear_bothInRange() {
    val regular = GlassParams.frostFloorAlpha(isClear = false)
    val clear = GlassParams.frostFloorAlpha(isClear = true)
    assertTrue("regular $regular should frost more than clear $clear", regular > clear)
    assertTrue(regular in 0f..1f)
    assertTrue(clear in 0f..1f)
  }
}
