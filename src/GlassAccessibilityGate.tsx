import {
  StyleSheet,
  useColorScheme,
  View,
  type NativeSyntheticEvent,
  type ViewProps,
} from 'react-native';

import {
  resolveAccessibility,
  useGlassAccessibilityState,
  type ResolvedAccessibility,
} from './accessibility';
import type { GlassPipelineInfo, LiquidGlassViewProps } from './types';

/**
 * Props that describe the glass material and mean nothing to an opaque surface.
 *
 * Listed explicitly rather than dropped by a rest-destructure so that adding a
 * prop to the public type forces a decision here, matching the convention in
 * the web fallback.
 */
const GLASS_ONLY_PROPS = [
  'preset',
  'variant',
  'intensity',
  'blurRadius',
  'rim',
  'specular',
  'interactive',
  'tilt',
  'refraction',
  'thickness',
  'edgeReflectionStrength',
  'legibilityFloor',
  'paused',
  'shape',
  'accessibilityMode',
  'onError',
] as const;

/**
 * Opaque backgrounds for the degraded surface.
 *
 * Deliberately neutral system-ish greys rather than pure black/white: the point
 * is to remove translucency, not to introduce maximum contrast against whatever
 * the app's own palette is.
 */
const OPAQUE_BACKGROUND = {
  light: '#F2F2F7',
  dark: '#1C1C1E',
} as const;

/**
 * The non-glass surface rendered when the user has asked for less transparency.
 *
 * Genuinely opaque — an opaque base with the caller's `tintColor` composited on
 * top at whatever alpha they gave it. Layering rather than substituting means a
 * translucent `rgba()` tint still reads as the app's colour without punching a
 * hole back through to the content behind, which is the thing being avoided.
 *
 * `dim` is honoured because it is a design choice about the surface rather than
 * an optical effect, and it sits under the children exactly as it does natively.
 */
export function OpaqueGlassSurface(props: LiquidGlassViewProps) {
  const scheme = useColorScheme();
  const base = scheme === 'dark' ? OPAQUE_BACKGROUND.dark : OPAQUE_BACKGROUND.light;

  const { tintColor, borderRadius = 0, dim = 0, style, children, onPipelineReady, ...rest } = props;

  const viewProps: Record<string, unknown> = { ...rest };
  for (const key of GLASS_ONLY_PROPS) delete viewProps[key];

  // Report a tier so a gate written as "render nothing until the tier arrives"
  // resolves here too. `none` is the honest answer: no glass was rendered.
  const handleRef = (node: unknown) => {
    if (node && onPipelineReady) {
      onPipelineReady({
        nativeEvent: {
          tier: 'none',
          osVersion: 0,
          shaderCompiled: false,
          supportsNativeGlass: false,
        },
      } as NativeSyntheticEvent<GlassPipelineInfo>);
    }
  };

  const scrim = Math.max(0, Math.min(1, dim));

  return (
    <View
      {...(viewProps as ViewProps)}
      ref={handleRef}
      style={[{ backgroundColor: base, borderRadius }, style]}
    >
      {tintColor ? (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: tintColor, borderRadius }]}
        />
      ) : null}
      {scrim > 0 ? (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: `rgba(0, 0, 0, ${scrim})`, borderRadius },
          ]}
        />
      ) : null}
      {children}
    </View>
  );
}

/**
 * Subscribes to the platform's accessibility preferences and picks a renderer.
 *
 * This exists as a component rather than a hook inside `<LiquidGlassView>` on
 * purpose. The wrappers stay pure prop-mapping functions that the unit tests
 * can invoke directly without a renderer — the subscription, and the
 * re-render that makes the response live, live here instead.
 */
export function GlassAccessibilityGate({
  props,
  renderGlass,
}: {
  props: LiquidGlassViewProps;
  renderGlass: (props: LiquidGlassViewProps, a11y: ResolvedAccessibility) => React.ReactElement;
}) {
  const state = useGlassAccessibilityState();
  const a11y = resolveAccessibility(props.accessibilityMode, state);

  if (a11y.opaque) return <OpaqueGlassSurface {...props} />;
  return renderGlass(props, a11y);
}
