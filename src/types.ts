import type { ColorValue, ViewProps } from 'react-native';

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
   * @default 0
   */
  borderRadius?: number;

  /**
   * Android only: toggle the AGSL edge-refraction shader (Android 13 / API 33+).
   * No effect on iOS, where refraction is rendered by the OS.
   * @default true
   */
  refraction?: boolean;
}
