import { codegenNativeComponent, type ViewProps } from 'react-native';
import type { Float, WithDefault } from 'react-native/Libraries/Types/CodegenTypes';

/**
 * Native spec for `<ScrollEdgeBlurView>`.
 *
 * A separate Fabric component rather than a mode on `LiquidGlassmorphismView`:
 * it has no children, no silhouette, no interaction and no tint — sharing the
 * glass view's twenty-odd props would mean documenting that most of them do
 * nothing here.
 */
export interface NativeProps extends ViewProps {
  /**
   * Which edge the blur is anchored to. It is opaque at that edge and
   * dissolves toward the opposite one.
   */
  edge?: WithDefault<'top' | 'bottom' | 'left' | 'right', 'top'>;

  /** Blur radius in dp at the anchored edge. */
  maxBlurRadius?: WithDefault<Float, 24>;

  /**
   * How far across the view the blur has fully dissolved, `0`–`1`.
   * `1` ramps across the whole view; smaller values finish sooner.
   */
  falloff?: WithDefault<Float, 1>;
}

export default codegenNativeComponent<NativeProps>('ScrollEdgeBlurView');
