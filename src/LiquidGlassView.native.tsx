import NativeLiquidGlass from './LiquidGlassmorphismViewNativeComponent';
import type { LiquidGlassViewProps } from './types';

/**
 * Native (iOS / Android) implementation of `<LiquidGlassView>`.
 *
 * Maps the friendly public props onto the codegen native component. The web
 * fallback lives in `LiquidGlassView.tsx`.
 */
export function LiquidGlassView({
  variant = 'regular',
  intensity = 60,
  interactive = false,
  refraction = true,
  borderRadius = 0,
  tintColor,
  style,
  children,
  ...rest
}: LiquidGlassViewProps) {
  return (
    <NativeLiquidGlass
      variant={variant}
      intensity={intensity}
      interactive={interactive}
      refraction={refraction}
      glassCornerRadius={borderRadius}
      tintColor={tintColor}
      style={[{ borderRadius }, style]}
      {...rest}
    >
      {children}
    </NativeLiquidGlass>
  );
}
