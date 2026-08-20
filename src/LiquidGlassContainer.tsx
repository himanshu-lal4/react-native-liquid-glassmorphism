import { View, type ViewProps } from 'react-native';

export interface LiquidGlassContainerProps extends ViewProps {
  /**
   * The distance, in dp, at which glass children begin to merge.
   *
   * `0` (the default) disables merging entirely and the children render as
   * ordinary separate glass, which is also what every unsupported platform
   * does — so `spacing` is the single switch for the whole feature.
   * @default 0
   */
  spacing?: number;
}

/**
 * Web / unsupported-platform fallback: a plain container.
 *
 * There is no glass to merge here, so this is not a degradation so much as the
 * absence of an enhancement — children still lay out identically.
 */
export function LiquidGlassContainer({ spacing: _spacing, ...rest }: LiquidGlassContainerProps) {
  return <View {...rest} />;
}
