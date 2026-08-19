import type { ColorValue, NativeSyntheticEvent, ViewProps } from 'react-native';

import type { GlassTier } from './capabilities';
import type { GlassPresetName } from './presets';
import type { LiquidGlassShape } from './shapes';

export type { LiquidGlassShape } from './shapes';

/**
 * What `onPipelineReady` reports: the tier that **actually rendered**, not what
 * the device is capable of. `getGlassCapabilities()` answers the latter.
 */
export type GlassPipelineInfo = Readonly<{
  /** The path this view really took. See {@link GlassTier}. */
  tier: GlassTier;
  /** Android API level, or the iOS major version. */
  osVersion: number;
  /** Android: whether the AGSL shader compiled. Always `false` on iOS. */
  shaderCompiled: boolean;
  /** Whether the OS rendered the glass itself (iOS 26 `UIGlassEffect`). */
  supportsNativeGlass: boolean;
}>;

/**
 * Why a view is not doing what its props asked for.
 *
 * - `SHADER_COMPILE_FAILED` — the AGSL would not compile; the view fell back a
 *   tier. Non-fatal.
 * - `PIPELINE_DEGRADED` — the OS version cannot run the requested tier.
 * - `INVALID_SHAPE` — the `shape` path could not be parsed; the view fell back
 *   to a rounded rectangle.
 * - `BACKDROP_CAPTURE_FAILED` — a view behind the glass refused a software
 *   draw, so the previous backdrop is being reused.
 * - `GLASS_UNAVAILABLE` — iOS below 26, so a `UIBlurEffect` material is
 *   standing in for `UIGlassEffect`.
 */
export type GlassErrorCode =
  | 'SHADER_COMPILE_FAILED'
  | 'PIPELINE_DEGRADED'
  | 'INVALID_SHAPE'
  | 'BACKDROP_CAPTURE_FAILED'
  | 'GLASS_UNAVAILABLE';

export type GlassErrorInfo = Readonly<{
  code: GlassErrorCode;
  message: string;
  /**
   * Whether the view gave up entirely. Almost always `false` — the view
   * recovered — but it still means the glass is not what the props describe.
   */
  fatal: boolean;
}>;

/**
 * Glass material style.
 *
 * - `regular` — adaptive frosted glass. Maps to iOS 26 `UIGlassEffect` regular
 *   style (or `UIBlurEffect` material below 26) and a medium-strength blur on
 *   Android.
 * - `clear` — lighter, more transparent glass, ideal over photos/video.
 */
export type GlassVariant = 'regular' | 'clear';

export interface LiquidGlassViewProps extends ViewProps {
  /**
   * Start from a tuned material instead of dialling the individual knobs.
   *
   * Resolved in JS as `{ ...GlassPresets[preset], ...yourProps }`, so any prop
   * you pass explicitly always wins. The raw map is exported as `GlassPresets`
   * if you want to read or extend the values.
   *
   * @example
   * <LiquidGlassView preset="floatingTabBar" borderRadius={32} />
   */
  preset?: GlassPresetName;

  /**
   * Glass material style.
   * @default 'regular'
   */
  variant?: GlassVariant;

  /**
   * Tint color layered over the blurred backdrop. Accepts any RN color value.
   * Use an `rgba()`/8-digit hex with alpha to control tint strength.
   */
  tintColor?: ColorValue;

  /**
   * Blur / material strength, `0`–`100`.
   *
   * On iOS 26 the system manages the glass material, so this is only used for
   * the pre-26 `UIBlurEffect` fallback. On Android it scales the RenderEffect
   * blur radius.
   * @default 60
   */
  intensity?: number;

  /**
   * Make the glass react to touch — iOS 26 interactive `UIGlassEffect`, and a
   * touch-following specular highlight on Android.
   * @default false
   */
  interactive?: boolean;

  /**
   * Android only: device-tilt specular driven by the gyro/accelerometer.
   *
   * Decoupled from {@link interactive} so you can have touch response *without*
   * an always-on motion sensor. The sensor is registered only while this is
   * `true`, so leaving it off saves battery on persistent chrome (tab/nav bars).
   * No-op on iOS, where the OS renders the glass specular.
   * @default false
   */
  tilt?: boolean;

  /**
   * Corner radius of the glass surface, in dp/points.
   *
   * Ignored when {@link shape} is set (the shape defines the silhouette).
   * @default 0
   */
  borderRadius?: number;

  /**
   * Custom silhouette for the glass — a circle, squircle, polygon, an explicit
   * set of points, or an arbitrary (even concave) SVG path. Omit for the default
   * rounded rectangle, which keeps the crispest native glass edges.
   *
   * The shape is stretched to fill the view's bounds, so size the view to the
   * shape's aspect ratio to avoid distortion. On Android the silhouette is
   * rendered via a signed-distance field (API 33+); below that it degrades to a
   * path-clipped frost. On iOS the glass is masked to the path.
   *
   * @example
   * <LiquidGlassView shape={{ type: 'circle' }} style={{ width: 96, height: 96 }} />
   * <LiquidGlassView shape={{ type: 'polygon', sides: 6 }} />
   * <LiquidGlassView shape={{ type: 'path', d: notchPath, width: W, height: H }} />
   */
  shape?: LiquidGlassShape;

  /**
   * Android only (API 33+). Dials the edge-refraction lens strength up (~1.35×).
   * Lensing is intrinsic to the glass material and is never fully off — set
   * `thickness={0}` for a genuinely flat pane. No effect on iOS, where
   * refraction is rendered by the OS.
   * @default true
   */
  refraction?: boolean;

  /**
   * "Liquid volume" — how thick / deep the liquid glass reads, by scaling the
   * refraction and lensing depth.
   *
   * - `0` — a flat glass pane (blur + tint, no lensing)
   * - `1` — the default liquid glass look
   * - up to `~2` — a deep, heavily-refracting lens
   *
   * Android only. No-op on iOS, where the OS fixes the `UIGlassEffect` optics.
   * @default 1
   */
  thickness?: number;

  /**
   * Android only: strength of the edge-reflection band — the upside-down "echo"
   * mirrored back at the top/bottom rim — from `0` (off) to `1` (default).
   *
   * Independent of {@link thickness}, so you can keep a deep lens while calming
   * the reflection over text-heavy backdrops, where the mirrored copy otherwise
   * reads as noise. No-op on iOS.
   * @default 1
   */
  edgeReflectionStrength?: number;

  /**
   * Android only: a `0`–`1` legibility veil drawn *under* the foreground
   * children so chrome (icons, labels) stays readable over `clear` glass,
   * without darkening the whole pane. The veil adapts to the backdrop
   * brightness (more veil over bright content) and is hued by {@link tintColor}
   * when set. `0` disables it. No-op on iOS.
   * @default 0
   */
  legibilityFloor?: number;

  /**
   * Android only: suspend the effect without unmounting. The glass holds its
   * last frame, and resuming re-captures immediately.
   *
   * The glass captures what is behind it once per frame, which is the single
   * most expensive thing it does. Set this whenever a view is mounted but not
   * being looked at and the library cannot tell on its own — a screen kept
   * alive in a navigator's stack, a carousel page off to the side.
   *
   * Views that Android itself reports as off-screen — behind a pushed screen,
   * on an inactive tab, or in a backgrounded app — pause automatically, so this
   * prop is for the cases that signal cannot see.
   *
   * No-op on iOS, where the OS owns the material's refresh.
   * @default false
   */
  paused?: boolean;

  /**
   * Fired once per view, after the first frame, reporting the tier that
   * actually rendered.
   *
   * Fires on every platform — including the web fallback, with `tier: 'none'` —
   * so a gate written as "render nothing until the tier arrives" resolves
   * everywhere rather than hanging.
   *
   * To decide whether to mount a glass view *at all*, use
   * `getGlassCapabilities()` instead: it answers before anything has committed.
   */
  onPipelineReady?: (event: NativeSyntheticEvent<GlassPipelineInfo>) => void;

  /**
   * Fired when the view cannot do what the props asked for — a shader that
   * would not compile, an unparseable `shape`, a backdrop capture that failed.
   *
   * Each code is reported at most once per view. Most are non-fatal: the view
   * recovered, but it is not rendering what you asked for. Everything is also
   * logged natively, so a handler is optional.
   */
  onError?: (event: NativeSyntheticEvent<GlassErrorInfo>) => void;
}
