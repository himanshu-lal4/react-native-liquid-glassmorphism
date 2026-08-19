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
   * The bug this guards: `clear` used to scale the blur ramp by 0.2, so the
   * whole 0–100 intensity range mapped onto 0.6–2.4dp. `intensity` was
   * therefore indistinguishable from a no-op on `clear`, which is what people
   * reported as "the clear variant has no blur".
   */
  @Test
  fun blurRadius_clearRespondsMeaningfullyToIntensity() {
    val low = GlassParams.blurRadiusPx(0, isClear = true, density = 3f)
    val high = GlassParams.blurRadiusPx(100, isClear = true, density = 3f)
    assertTrue("expected clear blur to grow with intensity", high > low)
    // In dp: the span across the full range must be visible, not sub-pixel.
    val spanDp = (high - low) / 3f
    assertTrue("clear blur span was only ${spanDp}dp across 0-100", spanDp >= 3f)
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
