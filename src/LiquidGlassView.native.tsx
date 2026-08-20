import { Platform, type NativeSyntheticEvent } from 'react-native';

import { DEFAULT_RESOLVED_ACCESSIBILITY, type ResolvedAccessibility } from './accessibility';
import { validateGlassProps } from './devValidate';
import { GlassAccessibilityGate } from './GlassAccessibilityGate';
import NativeLiquidGlass, {
  type GlassErrorEvent,
  type GlassFrameStatsEvent,
  type PipelineReadyEvent,
} from './LiquidGlassmorphismViewNativeComponent';
import { resolvePreset } from './presets';
import { mergePathOutline } from './mergePaths';
import { normalizeShape } from './shapes';
import type {
  GlassErrorInfo,
  GlassFrameStats,
  GlassPipelineInfo,
  LiquidGlassViewProps,
} from './types';

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
 * Props that only exist on the Android shader path.
 *
 * Grouped rather than destructured inline for two reasons: every default is a
 * branch, and `renderNativeGlass` was drifting well past the complexity budget;
 * and they have to be stripped from `...rest` so they never reach the host
 * component on iOS, which is easier to keep correct against one list.
 */
const ANDROID_ONLY_KEYS = [
  'edgeReflectionStrength',
  'legibilityFloor',
  'paused',
  'iridescence',
  'grain',
  'lightAngle',
  'specularSharpness',
  'saturation',
  'secondaryShape',
  'shapeSmoothing',
  'brightness',
  'magnification',
  'ior',
  'frameStatsInterval',
  'onFrameStats',
] as const;

function androidGlassProps(
  resolved: LiquidGlassViewProps,
  /** Already normalised to an SVG path — derived, not a raw prop. */
  secondaryShapePath: string,
  onFrameStats: ((event: NativeSyntheticEvent<GlassFrameStatsEvent>) => void) | undefined
) {
  const {
    edgeReflectionStrength = 1,
    legibilityFloor = 0,
    paused = false,
    iridescence = 0,
    grain = 0,
    lightAngle = 0,
    specularSharpness = 1,
    saturation = 1,
    brightness = 1,
    magnification = 1,
    ior = 1.5,
    shapeSmoothing = 0,
    frameStatsInterval = 0,
  } = resolved;

  return {
    edgeReflectionStrength,
    legibilityFloor,
    paused,
    iridescence,
    grain,
    lightAngle,
    specularSharpness,
    saturation,
    brightness,
    magnification,
    ior,
    secondaryShapePath,
    shapeSmoothing,
    // Only attach the handler when an interval was actually asked for. Passing
    // it unconditionally would have native dispatching to a listener nobody
    // reads — the exact cost this design exists to avoid.
    frameStatsInterval,
    ...(frameStatsInterval > 0 ? { onFrameStats } : null),
  };
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

  const resolved = resolvePreset(props);
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
    borderRadius = 0,
    shape,
    secondaryShape,
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
  } = resolved;

  // Ambient, sensor-driven motion is the thing Reduce Motion is about, so the
  // tilt specular is dropped and — because this is the prop native gates the
  // sensor registration on — no motion sensor is registered at all.
  //
  // `interactive` is deliberately left alone: it responds to a touch the user
  // just made, which is not the unbidden movement the setting asks to remove.
  const tiltEnabled = tilt && a11y.allowMotion;

  const handlePipelineReady = narrowHandler<PipelineReadyEvent, GlassPipelineInfo>(onPipelineReady);
  const handleError = narrowHandler<GlassErrorEvent, GlassErrorInfo>(onError);
  // Read off `resolved` rather than destructured: it belongs to the Android-only
  // group, which is scrubbed from `rest` by key rather than pulled out by name.
  const handleFrameStats = narrowHandler<GlassFrameStatsEvent, GlassFrameStats>(
    resolved.onFrameStats
  );

  // Normalise any custom shape to a single SVG path + view-box for native. The
  // output string is deterministic, so native prop-diffing skips the work (and
  // the Android SDF rebuild) whenever the shape is unchanged.
  const isAndroid = Platform.OS === 'android';
  const shapeSmoothingValue = resolved.shapeSmoothing ?? 0;

  const normalized = shape ? normalizeShape(shape) : null;
  const shapeProps = normalized
    ? {
        shapePath: normalized.path,
        shapeViewBoxWidth: normalized.viewBoxWidth,
        shapeViewBoxHeight: normalized.viewBoxHeight,
      }
    : { shapePath: '', shapeViewBoxWidth: 0, shapeViewBoxHeight: 0 };

  // The secondary rides the PRIMARY's view-box: native stretches one matrix
  // onto the bounds and applies it to both, which is what keeps the two bodies
  // in a shared coordinate space instead of each filling the view separately.
  const normalizedSecondary = normalized && secondaryShape ? normalizeShape(secondaryShape) : null;

  // iOS has no distance field to blend — the silhouette is a CAShapeLayer mask
  // — so the merged OUTLINE is computed in JS and handed over as one ordinary
  // path. Android keeps the native field merge, which is cheaper and higher
  // quality; this is the same effect expressed in the representation each
  // platform can actually use.
  //
  // Falls back to the primary shape alone if the outline cannot be produced
  // (an unflattenable path, e.g. an elliptic arc) rather than drawing something
  // wrong.
  const iosMerged =
    !isAndroid && normalized && normalizedSecondary
      ? mergePathOutline(
          normalized.path,
          normalizedSecondary.path,
          normalized.viewBoxWidth,
          normalized.viewBoxHeight,
          shapeSmoothingValue
        )
      : null;

  const effectiveShapeProps = iosMerged ? { ...shapeProps, shapePath: iosMerged } : shapeProps;

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

  // Genuinely Android-only: iOS glass fixes its own rim echo, the system
  // material manages its own contrast, and UIGlassEffect exposes none of the
  // look-shaping uniforms. On iOS they are dropped entirely rather than passed
  // and ignored.
  const platformProps = isAndroid
    ? androidGlassProps(resolved, normalizedSecondary?.path ?? '', handleFrameStats)
    : null;

  const hostRest: Record<string, unknown> = { ...rest };
  for (const key of ANDROID_ONLY_KEYS) delete hostRest[key];

  return (
    <NativeLiquidGlass
      variant={variant}
      intensity={intensity}
      interactive={interactive}
      tilt={tiltEnabled}
      refraction={refraction}
      glassCornerRadius={borderRadius}
      dim={dim}
      {...effectiveShapeProps}
      {...sharedProps}
      tintColor={tintColor}
      onPipelineReady={handlePipelineReady}
      onError={handleError}
      {...platformProps}
      // A custom shape defines its own silhouette, so don't also round the
      // outer container — that would clip the shape's corners.
      style={[normalized ? null : { borderRadius }, style]}
      {...(hostRest as object)}
    >
      {children}
    </NativeLiquidGlass>
  );
}
