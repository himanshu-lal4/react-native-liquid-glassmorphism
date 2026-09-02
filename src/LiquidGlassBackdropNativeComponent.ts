import { codegenNativeComponent, type ViewProps } from 'react-native';

/**
 * Native spec for `<LiquidGlassBackdrop>` (Android only).
 *
 * A container whose content is recorded into a GPU display list and handed to
 * the glass views inside it, replacing the per-frame software capture of the
 * window. It has no props of its own: wrapping is the whole configuration.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface NativeProps extends ViewProps {}

export default codegenNativeComponent<NativeProps>('LiquidGlassBackdrop');
