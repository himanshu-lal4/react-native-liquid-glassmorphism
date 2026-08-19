import type { ColorValue, ViewProps } from 'react-native';

import type { LiquidGlassShape } from './shapes';

export type { LiquidGlassShape } from './shapes';

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
   * Android only: an explicit blur radius in dp, overriding whatever
   * {@link intensity} would have derived.
   *
   * Reach for this when `intensity` isn't giving you the control you need —
   * most often on `clear` glass, which deliberately blurs far less than
   * `regular` and so spans a much narrower range across the whole 0–100
   * intensity scale. `blurRadius` ignores that scaling and gives both variants
   * the same units.
   *
   * Useful range is roughly `0`–`30`; `0` is a genuinely unblurred pane.
   * No-op on iOS, where the material's blur is the OS's to choose.
   *
   * @example
   * // Clear glass — transparent and refractive, but properly blurred.
   * <LiquidGlassView variant="clear" blurRadius={16} />
   */
  blurRadius?: number;

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
}
