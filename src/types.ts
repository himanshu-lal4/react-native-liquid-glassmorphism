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
   * Make the glass react to touch — iOS 26 interactive `UIGlassEffect`, and a
   * touch-following specular highlight on Android.
   * @default false
   */
  interactive?: boolean;

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
   * Android only: toggle the AGSL edge-refraction shader (Android 13 / API 33+).
   * No effect on iOS, where refraction is rendered by the OS.
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
}
