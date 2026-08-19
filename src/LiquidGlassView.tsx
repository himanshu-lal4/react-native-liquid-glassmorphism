import { View, type ViewProps } from 'react-native';

import { validateGlassProps } from './devValidate';
import { resolvePreset } from './presets';
import type { LiquidGlassViewProps } from './types';

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
  'edgeReflectionStrength',
  'legibilityFloor',
  // A custom silhouette needs a real GPU pipeline; the fallback renders a
  // rounded translucent surface, so the shape is intentionally ignored.
  'shape',
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
 */
export function LiquidGlassView(props: LiquidGlassViewProps) {
  if (__DEV__) {
    validateGlassProps(props);
  }

  const {
    tintColor,
    variant = 'regular',
    borderRadius = 0,
    style,
    children,
    ...rest
  } = resolvePreset(props);

  const viewProps: Record<string, unknown> = { ...rest };
  for (const key of NATIVE_ONLY_PROPS) delete viewProps[key];

  // The `regular` material dims its backdrop on the real implementations, which
  // is what keeps white-on-glass text readable. A uniformly transparent
  // fallback would put white text on a white background with no warning, so the
  // scrim tracks the variant rather than being a fixed value.
  const scrim = variant === 'clear' ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 255, 255, 0.18)';

  return (
    <View
      {...(viewProps as ViewProps)}
      style={[
        {
          backgroundColor: tintColor ?? scrim,
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
