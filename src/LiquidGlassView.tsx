import { StyleSheet, View } from 'react-native';

import type { LiquidGlassViewProps } from './types';

/**
 * Web / unsupported-platform fallback for `<LiquidGlassView>`.
 *
 * Real backdrop blur is not portable on the web through React Native, so this
 * renders a best-effort translucent surface. Metro resolves the native
 * implementation (`LiquidGlassView.native.tsx`) on iOS and Android.
 *
 * The optical props are dropped — there is no honest way to fake refraction
 * here. The two that are *design* choices rather than optics, `rim` and `dim`,
 * are honoured, so a scrim or a borderless pane still composes the same way it
 * does natively.
 */
export function LiquidGlassView({
  tintColor,
  borderRadius = 0,
  rim = true,
  dim = 0,
  specular: _specular,
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
  const scrim = Math.max(0, Math.min(1, dim));

  // The scrim gets its own layer, because a single `backgroundColor` cannot
  // carry both the tint and the dim, and natively `dim` sits under the
  // children. Only wrapped when there IS a scrim — otherwise `children` is
  // passed straight through, so the common case keeps the element tree (and
  // anything walking it) exactly as it was.
  const content =
    scrim > 0 ? (
      <>
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: `rgba(0, 0, 0, ${scrim})`, borderRadius },
          ]}
        />
        {children}
      </>
    ) : (
      children
    );

  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: tintColor ?? 'rgba(255, 255, 255, 0.18)',
          borderRadius,
          borderWidth: rim ? 1 : 0,
          borderColor: 'rgba(255, 255, 255, 0.35)',
        },
        style,
      ]}
    >
      {content}
    </View>
  );
}
