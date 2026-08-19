/**
 * Synchronous capability probing, so an app can branch **without** mounting a
 * glass view.
 *
 * The alternative — mount a view and wait for a native event — only answers the
 * question after a view has committed, which is useless for deciding whether to
 * render one at all. Everything here is derived from `Platform`, so it is safe to
 * call before mount, in a reducer, or in Jest.
 */

import { useMemo } from 'react';
import { Platform } from 'react-native';

/**
 * The best rendering tier a device can run, from richest to poorest.
 *
 * - `glass` — a real iOS 26 `UIGlassEffect`: system-rendered liquid glass.
 * - `refraction` — our AGSL shader on Android 13+ (API 33): blur, vibrancy,
 *   edge refraction, tint and specular.
 * - `blur` — a real backdrop blur without edge lensing. iOS 15–25
 *   (`UIBlurEffect` material) and Android 12 (API 31–32, `RenderEffect`).
 * - `tint` — a translucent tinted surface with a rim, no blur. Android < API 31.
 * - `none` — no native implementation; the JS fallback renders.
 */
export type GlassTier = 'glass' | 'refraction' | 'blur' | 'tint' | 'none';

export type GlassCapabilities = Readonly<{
  /** Whether a native implementation exists on this platform at all. */
  supported: boolean;

  /**
   * The best tier this device can render.
   *
   * This is a device capability, not a promise about a particular view: an
   * explicit prop can still hold a capable device to a lower tier.
   */
  tier: GlassTier;

  /**
   * Android API level, or the iOS major version. `0` where neither applies.
   *
   * iOS reports `Platform.Version` as a string (`'26.1'`); this is the parsed
   * major component, so it is comparable with `>=` on both platforms.
   */
  osVersion: number;

  /**
   * Whether the glass is rendered by the OS as a real `UIGlassEffect`
   * (iOS 26+), rather than by our shader or a `UIBlurEffect` material.
   */
  supportsNativeGlass: boolean;

  /** Whether the backdrop is really blurred, as opposed to only tinted. */
  supportsBlur: boolean;

  /** Whether edge refraction / lensing renders. */
  supportsRefraction: boolean;

  /**
   * Whether a custom `shape` renders as full glass.
   *
   * Below Android API 33 a silhouette still clips correctly, but through a
   * path-clipped frost rather than the signed-distance field that carries the
   * lens optics — so the shape is honoured while the glass is not.
   */
  supportsShapes: boolean;
}>;

const UNSUPPORTED: GlassCapabilities = Object.freeze({
  supported: false,
  tier: 'none' as const,
  osVersion: 0,
  supportsNativeGlass: false,
  supportsBlur: false,
  supportsRefraction: false,
  supportsShapes: false,
});

/**
 * Read this device's glass capabilities.
 *
 * Derived at call time rather than at module scope, so the module stays
 * importable in tests that mock `Platform` per case.
 */
export function getGlassCapabilities(): GlassCapabilities {
  if (Platform.OS === 'ios') {
    const osVersion = majorVersion(Platform.Version);
    // iOS 26 introduced UIGlassEffect. Below it we use a UIBlurEffect material,
    // which is a genuine backdrop blur but has no edge lensing.
    const nativeGlass = osVersion >= 26;
    return Object.freeze({
      supported: true,
      tier: nativeGlass ? ('glass' as const) : ('blur' as const),
      osVersion,
      supportsNativeGlass: nativeGlass,
      supportsBlur: true,
      // Refraction on iOS is the OS's to render, and only UIGlassEffect does it.
      supportsRefraction: nativeGlass,
      // Silhouettes are a CAShapeLayer mask on the effect view, which works on
      // every iOS version we support.
      supportsShapes: true,
    });
  }

  if (Platform.OS === 'android') {
    const osVersion = majorVersion(Platform.Version);
    // API 33 (Tiramisu) is the AGSL RuntimeShader floor; API 31 (S) is the
    // RenderEffect blur floor. Below that we can only tint.
    const refraction = osVersion >= 33;
    const blur = osVersion >= 31;

    let tier: GlassTier = 'tint';
    if (refraction) tier = 'refraction';
    else if (blur) tier = 'blur';

    return Object.freeze({
      supported: true,
      tier,
      osVersion,
      supportsNativeGlass: false,
      supportsBlur: blur,
      supportsRefraction: refraction,
      supportsShapes: refraction,
    });
  }

  return UNSUPPORTED;
}

/**
 * Whether a native implementation exists on this platform.
 *
 * `true` does not mean the full effect renders — read `tier` for that.
 */
export function isLiquidGlassSupported(): boolean {
  return getGlassCapabilities().supported;
}

/**
 * Hook form of {@link getGlassCapabilities}.
 *
 * The value cannot change for the life of the process, so this is a convenience
 * for keeping the call out of render bodies rather than a subscription.
 */
export function useGlassSupport(): GlassCapabilities {
  return useMemo(() => getGlassCapabilities(), []);
}

/**
 * `Platform.Version` is a number on Android and a version string on iOS
 * (`'26.1'`). Normalise both to a comparable major number.
 */
function majorVersion(version: number | string): number {
  if (typeof version === 'number') {
    return Number.isFinite(version) ? version : 0;
  }
  const parsed = parseInt(version, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}
