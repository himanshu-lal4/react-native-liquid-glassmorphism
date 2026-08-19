import { View } from 'react-native';

import type { LiquidGlassViewProps } from './types';

/**
 * Web / unsupported-platform fallback for `<LiquidGlassView>`.
 *
 * Real backdrop blur is not portable on the web through React Native, so this
 * renders a best-effort translucent surface. Metro resolves the native
 * implementation (`LiquidGlassView.native.tsx`) on iOS and Android.
 */
export function LiquidGlassView({
  tintColor,
  borderRadius = 0,
  interactive: _interactive,
  intensity: _intensity,
  blurRadius: _blurRadius,
  variant: _variant,
  refraction: _refraction,
  thickness: _thickness,
  // Custom silhouettes need a real GPU pipeline; the web fallback just renders a
  // rounded translucent surface, so the shape is intentionally ignored here.
  shape: _shape,
  style,
  children,
  ...rest
}: LiquidGlassViewProps) {
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: tintColor ?? 'rgba(255, 255, 255, 0.18)',
          borderRadius,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.35)',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
