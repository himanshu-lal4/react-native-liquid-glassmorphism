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
  fun frostFloor_regularIsMilkierThanClear_bothInRange() {
    val regular = GlassParams.frostFloorAlpha(isClear = false)
    val clear = GlassParams.frostFloorAlpha(isClear = true)
    assertTrue("regular $regular should frost more than clear $clear", regular > clear)
    assertTrue(regular in 0f..1f)
    assertTrue(clear in 0f..1f)
  }
}
