import { codegenNativeComponent, type ViewProps } from 'react-native';
import type { Float, WithDefault } from 'react-native/Libraries/Types/CodegenTypes';

/**
 * Native spec for `<LiquidGlassContainer>`.
 *
 * Cross-view merging: glass children inside a container fuse where they come
 * close, instead of overlapping as separate panes.
 *
 * The two platforms get there differently, which is the same split the rest of
 * this library uses. iOS 26 has `UIGlassContainerEffect` and the OS does the
 * merge. Android has no equivalent, so the container renders ONE glass surface
 * and smooth-mins its children's rounded-rect distance functions in AGSL —
 * analytic and per-pixel, so a child moving costs a uniform update rather than
 * a distance-field rebuild.
 */
export interface NativeProps extends ViewProps {
  /**
   * The distance, in dp, at which children begin to merge. `0` disables
   * merging and they render as ordinary separate glass.
   */
  spacing?: WithDefault<Float, 0>;
}

export default codegenNativeComponent<NativeProps>('LiquidGlassContainer');
