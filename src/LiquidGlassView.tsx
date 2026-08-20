import { StyleSheet, View, type NativeSyntheticEvent, type ViewProps } from 'react-native';

import { validateGlassProps } from './devValidate';
import { GlassAccessibilityGate } from './GlassAccessibilityGate';
import { resolvePreset } from './presets';
import type { GlassPipelineInfo, LiquidGlassViewProps } from './types';

/**
 * Props that mean something only to the native implementations. They are
 * removed rather than forwarded, so they never land on the underlying `View`.
 *
 * Listed explicitly rather than dropped by a rest-destructure so that adding a
 * prop to the public type forces a decision here.
 */
const NATIVE_ONLY_PROPS = [
  'intensity',
  'interactive',
  'tilt',
  'refraction',
  'thickness',
  'blurRadius',
  'specular',
  'edgeReflectionStrength',
  'legibilityFloor',
  'paused',
  // Look-shaping uniforms — they exist only inside the AGSL shader, so there is
  // nothing honest the fallback can do with them.
  'iridescence',
  'grain',
  'lightAngle',
  'specularSharpness',
  'saturation',
  'brightness',
  'frameStatsInterval',
  'onFrameStats',
  // A custom silhouette needs a real GPU pipeline; the fallback renders a
  // rounded translucent surface, so the shape is intentionally ignored.
  'shape',
  // Consumed by the accessibility gate before this renderer is reached.
  'accessibilityMode',
  // Accepted so a cross-platform tree type-checks, but never fired: nothing
  // here can fail the way the native implementations can, so there would be no
  // honest error to report.
  'onError',
] as const;

/**
 * Web / unsupported-platform fallback for `<LiquidGlassView>`.
 *
 * Real backdrop blur is not portable on the web through React Native, so this
 * renders a best-effort translucent surface. Metro resolves the native
 * implementation (`LiquidGlassView.native.tsx`) on iOS and Android.
 *
 * Presets are still resolved here so a `preset` that sets `variant` or
 * `borderRadius` shapes the fallback too, and a cross-platform tree renders
 * consistently rather than silently dropping the prop.
 *
 * The optical props are dropped — there is no honest way to fake refraction
 * here. The two that are *design* choices rather than optics, `rim` and `dim`,
 * are honoured, so a scrim or a borderless pane still composes the same way it
 * does natively.
 */
export function LiquidGlassView(props: LiquidGlassViewProps) {
  return <GlassAccessibilityGate props={props} renderGlass={renderWebGlass} />;
}

/**
 * The fallback's prop mapping, without the accessibility subscription.
 *
 * Kept hook-free and separate from {@link LiquidGlassView} so the unit tests
 * can invoke it directly and inspect the returned element.
 */
export function renderWebGlass(props: LiquidGlassViewProps) {
  if (__DEV__) {
    validateGlassProps(props);
  }

  const {
    tintColor,
    variant = 'regular',
    borderRadius = 0,
    rim = true,
    dim = 0,
    style,
    children,
    onPipelineReady,
    ...rest
  } = resolvePreset(props);

  const viewProps: Record<string, unknown> = { ...rest };
  for (const key of NATIVE_ONLY_PROPS) delete viewProps[key];

  // Report the tier once, after mount, so a gate written as "render nothing
  // until the tier arrives" resolves here instead of hanging forever.
  //
  // A ref callback rather than an effect: it runs in the commit phase, exactly
  // once per mount, and keeps this component a plain function that tests can
  // call directly — no renderer, and no hook that would make it one.
  const handleRef = (node: unknown) => {
    if (node && onPipelineReady) {
      onPipelineReady({
        nativeEvent: {
          tier: 'none',
          osVersion: 0,
          shaderCompiled: false,
          supportsNativeGlass: false,
        },
        // Only `nativeEvent` is populated: this is a synthesised compatibility
        // report, not a real host event.
      } as NativeSyntheticEvent<GlassPipelineInfo>);
    }
  };

  // The `regular` material dims its backdrop on the real implementations, which
  // is what keeps white-on-glass text readable. A uniformly transparent
  // fallback would put white text on a white background with no warning, so the
  // wash tracks the variant rather than being a fixed value.
  const wash = variant === 'clear' ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 255, 255, 0.18)';

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
      {...(viewProps as ViewProps)}
      ref={handleRef}
      style={[
        {
          backgroundColor: tintColor ?? wash,
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
