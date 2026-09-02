import { Platform, View } from 'react-native';

import NativeLiquidGlassBackdrop from './LiquidGlassBackdropNativeComponent';
import type { LiquidGlassBackdropProps } from './LiquidGlassBackdrop';

export type { LiquidGlassBackdropProps } from './LiquidGlassBackdrop';

/**
 * Wrap the content that sits behind your glass.
 *
 * ```tsx
 * <LiquidGlassBackdrop style={{ flex: 1 }}>
 *   <ScrollView>{feed}</ScrollView>
 *   <LiquidGlassView style={styles.floatingTabBar}>{tabs}</LiquidGlassView>
 * </LiquidGlassBackdrop>
 * ```
 *
 * **Android** records the wrapped content into a GPU display list once per
 * frame and every glass view inside samples that, instead of the library's
 * default per-frame software capture of the whole window. Scrolling under the
 * glass then costs nothing extra, and two things the capture path cannot do
 * start working: glass on glass (a glass control on a glass sheet sees the
 * sheet), and transforms (a press-scaled or rotated pane keeps the world
 * behind it still). Needs API 29+; older devices fall back to the capture.
 *
 * The one rule: glass inside a backdrop is composited **above** everything
 * else in it, in tree order. Put overlays that must cover the glass outside
 * the backdrop.
 *
 * **iOS** reads the real backdrop natively already, so this is a plain `View`
 * there — the same tree works on both platforms.
 */
export function LiquidGlassBackdrop(props: LiquidGlassBackdropProps) {
  if (Platform.OS !== 'android') return <View {...props} />;
  return <NativeLiquidGlassBackdrop {...props} />;
}
