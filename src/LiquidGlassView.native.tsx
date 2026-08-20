import { Platform, type NativeSyntheticEvent } from 'react-native';

import { DEFAULT_RESOLVED_ACCESSIBILITY, type ResolvedAccessibility } from './accessibility';
import { validateGlassProps } from './devValidate';
import { GlassAccessibilityGate } from './GlassAccessibilityGate';
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
 * Wraps the prop mapping in the accessibility gate, which subscribes to the
 * platform's Reduce Transparency / Reduce Motion preferences and swaps in an
 * opaque surface when asked. The mapping itself stays a pure function —
 * see {@link renderNativeGlass}.
 *
 * The web fallback lives in `LiquidGlassView.tsx`.
 */
export function LiquidGlassView(props: LiquidGlassViewProps) {
  return <GlassAccessibilityGate props={props} renderGlass={renderNativeGlass} />;
}

/**
 * Maps the friendly public props onto the codegen native component.
 *
 * Kept separate from {@link LiquidGlassView} and free of hooks so the unit
 * tests can invoke it directly and inspect the returned element, with no
 * renderer involved.
 *
 * @param a11y resolved accessibility decisions; defaults to "no preferences
 *   set", which is what a direct call in a test wants.
 */
export function renderNativeGlass(
  props: LiquidGlassViewProps,
  a11y: ResolvedAccessibility = DEFAULT_RESOLVED_ACCESSIBILITY
) {
  // Validate what the caller actually passed, before presets and defaults have
  // had a chance to fill anything in. Stripped from production bundles.
  if (__DEV__) {
    validateGlassProps(props);
  }

  const {
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
    iridescence = 0,
    grain = 0,
    lightAngle = 0,
    specularSharpness = 1,
    saturation = 1,
    brightness = 1,
    paused = false,
    borderRadius = 0,
    shape,
    tintColor,
    style,
    children,
    onPipelineReady,
    onError,
    // Consumed by the gate above; native has no such prop, so it must not ride
    // along in `...rest` onto the host component. Destructured purely to drop
    // it, hence the lint exemption.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    accessibilityMode: _accessibilityMode,
    ...rest
  } = resolvePreset(props);

  // Ambient, sensor-driven motion is the thing Reduce Motion is about, so the
  // tilt specular is dropped and — because this is the prop native gates the
  // sensor registration on — no motion sensor is registered at all.
  //
  // `interactive` is deliberately left alone: it responds to a touch the user
  // just made, which is not the unbidden movement the setting asks to remove.
  const tiltEnabled = tilt && a11y.allowMotion;

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
      typeof blurRadius === 'number' && Number.isFinite(blurRadius) ? Math.max(0, blurRadius) : -1,
  };

  // Genuinely Android-only optics: iOS glass fixes its own rim echo, and the
  // system material manages its own contrast.
  const platformProps =
    Platform.OS === 'android'
      ? {
          edgeReflectionStrength,
          legibilityFloor,
          paused,
          // Look-shaping uniforms. All Android-only: iOS 26 hands the optics to
          // UIGlassEffect, which exposes none of these.
          iridescence,
          grain,
          lightAngle,
          specularSharpness,
          saturation,
          brightness,
        }
      : null;

  return (
    <NativeLiquidGlass
      variant={variant}
      intensity={intensity}
      interactive={interactive}
      tilt={tiltEnabled}
      refraction={refraction}
      glassCornerRadius={borderRadius}
      dim={dim}
      {...shapeProps}
      {...sharedProps}
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
