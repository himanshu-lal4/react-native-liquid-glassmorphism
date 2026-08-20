import NativeLiquidGlassContainer from './LiquidGlassContainerNativeComponent';
import type { LiquidGlassContainerProps } from './LiquidGlassContainer';

export type { LiquidGlassContainerProps } from './LiquidGlassContainer';

/**
 * Makes glass children fuse where they come close, instead of overlapping as
 * separate panes.
 *
 * ```tsx
 * <LiquidGlassContainer spacing={40}>
 *   <LiquidGlassView style={{ width: 96, height: 96, borderRadius: 48 }} />
 *   <LiquidGlassView style={{ width: 96, height: 96, borderRadius: 48 }} />
 * </LiquidGlassContainer>
 * ```
 *
 * **iOS 26** hands this to `UIGlassContainerEffect` — the OS merges the
 * children's glass itself. Below iOS 26 there is no such effect and the
 * children render as ordinary separate glass.
 *
 * **Android** has no OS equivalent, so the container renders one glass surface
 * and smooth-mins the children's rounded rectangles in the shader. That is
 * analytic and per-pixel, so **a child moving costs a uniform upload, not a
 * distance-field rebuild** — which is the difference between this and
 * `secondaryShape`, and the reason this one can be animated.
 *
 * Two Android limits worth knowing: bodies are rounded rectangles taken from
 * each child's size and `borderRadius` (an arbitrary `shape` is not merged),
 * and at most 8 children merge, because the shader's uniform array needs a
 * compile-time bound.
 */
export function LiquidGlassContainer({
  spacing = 0,
  children,
  ...rest
}: LiquidGlassContainerProps) {
  return (
    <NativeLiquidGlassContainer spacing={spacing} {...rest}>
      {children}
    </NativeLiquidGlassContainer>
  );
}
