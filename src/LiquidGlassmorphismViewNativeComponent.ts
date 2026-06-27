import { codegenNativeComponent, type ColorValue, type ViewProps } from 'react-native';
import type { Int32, WithDefault } from 'react-native/Libraries/Types/CodegenTypes';

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
   * Android only: enable the AGSL edge-refraction shader (API 33+).
   * No-op on iOS, where the OS renders refraction natively.
   */
  refraction?: boolean;
}

export default codegenNativeComponent<NativeProps>('LiquidGlassmorphismView');
