import { Platform, type NativeSyntheticEvent } from 'react-native';

import { validateGlassProps } from './devValidate';
import NativeLiquidGlass, {
  type GlassErrorEvent,
  type PipelineReadyEvent,
} from './LiquidGlassmorphismViewNativeComponent';
import { resolvePreset } from './presets';
import { normalizeShape } from './shapes';
import type { GlassErrorInfo, GlassPipelineInfo, LiquidGlassViewProps } from './types';

/**
 * Re-type a native event payload's string field as the union the public API
 * documents.
 *
 * Codegen event payloads cannot carry a union type, so `tier` and `code` cross
 * the bridge as plain strings. Native only ever sends a member of the union, so
 * this is a re-typing rather than a conversion — but it is confined here rather
 * than pushed onto every consumer.
 */
function narrowHandler<From, To>(
  handler: ((event: NativeSyntheticEvent<To>) => void) | undefined
): ((event: NativeSyntheticEvent<From>) => void) | undefined {
  if (!handler) return undefined;
  return (event) => handler(event as unknown as NativeSyntheticEvent<To>);
}

/**
 * Native (iOS / Android) implementation of `<LiquidGlassView>`.
 *
 * Maps the friendly public props onto the codegen native component. The web
 * fallback lives in `LiquidGlassView.tsx`.
 */
export function LiquidGlassView(props: LiquidGlassViewProps) {
  // Validate what the caller actually passed, before presets and defaults have
  // had a chance to fill anything in. Stripped from production bundles.
  if (__DEV__) {
    validateGlassProps(props);
  }

  const {
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
    onPipelineReady,
    onError,
    ...rest
  } = resolvePreset(props);

  const handlePipelineReady = narrowHandler<PipelineReadyEvent, GlassPipelineInfo>(onPipelineReady);
  const handleError = narrowHandler<GlassErrorEvent, GlassErrorInfo>(onError);

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
    Platform.OS === 'android' ? { thickness, edgeReflectionStrength, legibilityFloor } : null;

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
      onPipelineReady={handlePipelineReady}
      onError={handleError}
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
