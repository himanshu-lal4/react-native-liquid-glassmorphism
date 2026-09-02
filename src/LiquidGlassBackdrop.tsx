import { View, type ViewProps } from 'react-native';

/** `<LiquidGlassBackdrop>` takes ordinary `View` props and nothing else. */
export type LiquidGlassBackdropProps = ViewProps;

/**
 * Web / unsupported-platform fallback: a plain container.
 *
 * The backdrop is an Android rendering strategy, not a visual; everywhere else
 * the children lay out identically inside a `View`.
 */
export function LiquidGlassBackdrop(props: LiquidGlassBackdropProps) {
  return <View {...props} />;
}
