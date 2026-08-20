import { View, type ViewProps } from 'react-native';

/** Which edge the blur is anchored to. */
export type ScrollEdge = 'top' | 'bottom' | 'left' | 'right';

export interface ScrollEdgeBlurViewProps extends ViewProps {
  /**
   * The edge the blur is anchored to. It is at full strength there and
   * dissolves toward the opposite side.
   * @default 'top'
   */
  edge?: ScrollEdge;

  /**
   * Blur radius at the anchored edge, in **dp**.
   *
   * Deliberately dp rather than the raw pixels the competing implementation
   * uses — that unit leaks a native 0–100 clamp into the public API, and a
   * radius that means different things on different densities is a bug
   * waiting to be filed.
   *
   * On iOS this selects the nearest discrete `UIBlurEffect` material, since
   * UIKit exposes no continuous radius; it is the closest equivalent rather
   * than a literal value.
   * @default 24
   */
  maxBlurRadius?: number;

  /**
   * How far across the view the blur has fully dissolved, `0`–`1`.
   * `1` ramps across the whole view; smaller values finish sooner.
   * @default 1
   */
  falloff?: number;
}

/**
 * Web / unsupported-platform fallback.
 *
 * There is no honest way to fake a backdrop blur here, and a translucent scrim
 * would be worse than nothing over content — a header already has its own
 * background. So this renders an inert, transparent view that occupies the
 * same space, and a cross-platform tree keeps its layout.
 */
export function ScrollEdgeBlurView({
  edge: _edge,
  maxBlurRadius: _maxBlurRadius,
  falloff: _falloff,
  ...rest
}: ScrollEdgeBlurViewProps) {
  return <View {...rest} pointerEvents="none" />;
}
