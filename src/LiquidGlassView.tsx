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
  variant: _variant,
  refraction: _refraction,
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
