import { Platform } from 'react-native';

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
  thickness = 1,
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
      // Android-only "liquid volume"; iOS glass optics are OS-fixed, so we don't
      // send it there (keeps it off the iOS native prop surface entirely).
      {...(Platform.OS === 'android' ? { thickness } : null)}
      style={[{ borderRadius }, style]}
      {...rest}
    >
      {children}
    </NativeLiquidGlass>
  );
}
