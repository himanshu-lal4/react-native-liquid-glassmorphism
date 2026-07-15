import { Platform } from 'react-native';

import NativeLiquidGlass from './LiquidGlassmorphismViewNativeComponent';
import { normalizeShape } from './shapes';
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
  tilt = false,
  refraction = true,
  thickness = 1,
  edgeReflectionStrength = 1,
  legibilityFloor = 0,
  borderRadius = 0,
  shape,
  tintColor,
  style,
  children,
  ...rest
}: LiquidGlassViewProps) {
  // Normalise any custom shape to a single SVG path + view-box for native. The
  // output string is deterministic, so native prop-diffing skips the work (and
  // the Android SDF rebuild) whenever the shape is unchanged.
  const normalized = shape ? normalizeShape(shape) : null;
  const shapeProps = normalized
    ? {
        shapePath: normalized.path,
        shapeViewBoxWidth: normalized.viewBoxWidth,
        shapeViewBoxHeight: normalized.viewBoxHeight,
      }
    : { shapePath: '', shapeViewBoxWidth: 0, shapeViewBoxHeight: 0 };

  // Android-only optics (liquid volume, edge-reflection, legibility veil); iOS
  // glass is OS-fixed, so we keep these off the iOS native prop surface.
  const platformProps =
    Platform.OS === 'android'
      ? { thickness, edgeReflectionStrength, legibilityFloor }
      : null;

  return (
    <NativeLiquidGlass
      variant={variant}
      intensity={intensity}
      interactive={interactive}
      tilt={tilt}
      refraction={refraction}
      glassCornerRadius={borderRadius}
      {...shapeProps}
      tintColor={tintColor}
      {...platformProps}
      // A custom shape defines its own silhouette, so don't also round the
      // outer container — that would clip the shape's corners.
      style={[normalized ? null : { borderRadius }, style]}
      {...rest}
    >
      {children}
    </NativeLiquidGlass>
  );
}
