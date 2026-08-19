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
  blurRadius,
  rim = true,
  specular = true,
  dim = 0,
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

  // The composition primitives go to BOTH platforms. iOS cannot dial the glass
  // optics — those belong to the system material — but it can answer the one
  // question that matters for a non-glass surface: with every layer switched
  // off, it swaps UIGlassEffect for a plain UIBlurEffect material. So `rim`,
  // `specular`, `thickness` and `blurRadius` all have to reach it.
  //
  // `blurRadius` uses a negative sentinel for "unset", because codegen floats
  // cannot be null — native then derives the radius from `intensity`.
  const sharedProps = {
    rim,
    specular,
    thickness,
    // `typeof` rather than a null check: it also catches a non-number arriving
    // from untyped JS, which would otherwise reach the shader.
    blurRadius:
      typeof blurRadius === 'number' && Number.isFinite(blurRadius)
        ? Math.max(0, blurRadius)
        : -1,
  };

  // Genuinely Android-only optics: iOS glass fixes its own rim echo, and the
  // system material manages its own contrast.
  const platformProps =
    Platform.OS === 'android'
      ? { edgeReflectionStrength, legibilityFloor }
      : null;

  return (
    <NativeLiquidGlass
      variant={variant}
      intensity={intensity}
      interactive={interactive}
      tilt={tilt}
      refraction={refraction}
      glassCornerRadius={borderRadius}
      dim={dim}
      {...shapeProps}
      {...sharedProps}
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
