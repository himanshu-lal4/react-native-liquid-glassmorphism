import { codegenNativeComponent, type ColorValue, type ViewProps } from 'react-native';
import type { Float, Int32, WithDefault } from 'react-native/Libraries/Types/CodegenTypes';

/**
 * Codegen spec for the native Liquid Glass Fabric component.
 *
 * This is the low-level contract between JS and native. App code should use the
 * `<LiquidGlassView>` wrapper from the package root, not this component directly.
 */
export interface NativeProps extends ViewProps {
  /**
   * Glass material style.
   * - `regular`: adaptive frosted glass (iOS 26 `.regular` / blurred material).
   * - `clear`: lighter, more transparent glass for media-rich backgrounds.
   */
  variant?: WithDefault<'regular' | 'clear', 'regular'>;

  /** Tint applied over the blurred backdrop. */
  tintColor?: ColorValue;

  /** Blur / material strength, 0–100. Ignored on iOS 26 native glass (OS-managed). */
  intensity?: WithDefault<Int32, 60>;

  /** iOS 26 interactive glass + Android touch-reactive specular highlight. */
  interactive?: boolean;

  /** Corner radius of the glass surface, in dp/points. */
  glassCornerRadius?: WithDefault<Int32, 0>;

  /**
   * Custom silhouette as an SVG path string, authored in the view-box given by
   * `shapeViewBoxWidth`/`Height` and stretched to fill the view. Empty string
   * (the default) means "use the rounded rectangle from `glassCornerRadius`".
   */
  shapePath?: WithDefault<string, ''>;

  /** Width of the coordinate space `shapePath` is authored in. `0` = no shape. */
  shapeViewBoxWidth?: WithDefault<Float, 0>;

  /** Height of the coordinate space `shapePath` is authored in. `0` = no shape. */
  shapeViewBoxHeight?: WithDefault<Float, 0>;

  /**
   * Android only: enable the AGSL edge-refraction shader (API 33+).
   * No-op on iOS, where the OS renders refraction natively.
   */
  refraction?: boolean;

  /**
   * Android only: "liquid volume" — scales the refraction/lens depth of the
   * glass. 0 = flat pane (no lensing), 1 = default, up to ~2 = deep liquid lens.
   * No-op on iOS, where the OS fixes the glass optics.
   */
  thickness?: WithDefault<Float, 1.0>;
}

export default codegenNativeComponent<NativeProps>('LiquidGlassmorphismView');
