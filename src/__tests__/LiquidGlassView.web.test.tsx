/**
 * Unit tests for the web / unsupported-platform fallback of `<LiquidGlassView>`.
 *
 * The fallback renders a plain RN `View` styled as a best-effort translucent
 * surface, and must NOT leak glass-only props (variant/intensity/interactive/
 * refraction) onto the underlying View.
 */
import { View } from 'react-native';

// Force the web fallback file explicitly. A bare '../LiquidGlassView' import is
// platform-resolved by the react-native jest preset to '.native.tsx'; requiring
// the exact '.tsx' extension bypasses that and loads the web fallback.
const { LiquidGlassView } = require('../LiquidGlassView.tsx');

const render = (props = {}) => LiquidGlassView(props as any) as any;
// Flatten the style array the fallback builds into a single object.
const flatStyle = (el: any) => Object.assign({}, ...el.props.style);

// These cases deliberately pass platform-specific props to prove they are not
// leaked onto the View; the dev validator's "does nothing here" notices are
// expected and covered by devValidate.test.ts, so keep them out of the output.
let warn: jest.SpyInstance;
beforeAll(() => {
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterAll(() => warn.mockRestore());

describe('LiquidGlassView (web fallback)', () => {
  it('renders a plain RN View', () => {
    expect(render().type).toBe(View);
  });

  it('defaults to a translucent white surface when no tintColor is given', () => {
    expect(flatStyle(render()).backgroundColor).toBe('rgba(255, 255, 255, 0.18)');
  });

  it('uses tintColor as the background when provided', () => {
    expect(flatStyle(render({ tintColor: '#123456' })).backgroundColor).toBe('#123456');
  });

  // `rim` and `dim` are design choices rather than optics, so the fallback
  // honours them instead of dropping them with the rest.
  it('drops the border when rim is off', () => {
    expect(flatStyle(render()).borderWidth).toBe(1);
    expect(flatStyle(render({ rim: false })).borderWidth).toBe(0);
  });

  it('renders a scrim layer for dim', () => {
    const scrim = render({ dim: 0.4 }).props.children.props.children[0];
    expect(Object.assign({}, ...scrim.props.style).backgroundColor).toBe('rgba(0, 0, 0, 0.4)');
  });

  // At dim 0 the children must reach the View untouched — no wrapper, no extra
  // null slot — or anything walking the tree sees a different shape.
  it('passes children through untouched when dim is 0', () => {
    expect(render({ children: 'hi' }).props.children).toBe('hi');
  });

  it('applies borderRadius', () => {
    expect(flatStyle(render({ borderRadius: 20 })).borderRadius).toBe(20);
  });

  it('uses the lighter scrim for the clear variant', () => {
    expect(flatStyle(render({ variant: 'clear' })).backgroundColor).toBe(
      'rgba(255, 255, 255, 0.10)'
    );
  });

  // The point of synthesising this: a gate written as "render nothing until the
  // tier arrives" would otherwise hang forever off-Android/iOS. The ref
  // callback runs on mount, so invoking it with a node is what a mount looks
  // like from here.
  describe('onPipelineReady', () => {
    it('reports tier "none" once the view has mounted', () => {
      const onPipelineReady = jest.fn();
      render({ onPipelineReady }).props.ref({});
      expect(onPipelineReady).toHaveBeenCalledTimes(1);
      expect(onPipelineReady.mock.calls[0][0].nativeEvent).toStrictEqual({
        tier: 'none',
        osVersion: 0,
        shaderCompiled: false,
        supportsNativeGlass: false,
      });
    });

    it('does not report on unmount, when the ref is called with null', () => {
      const onPipelineReady = jest.fn();
      render({ onPipelineReady }).props.ref(null);
      expect(onPipelineReady).not.toHaveBeenCalled();
    });

    it('is safe to mount with no handler attached', () => {
      expect(() => render().props.ref({})).not.toThrow();
    });
  });

  it('accepts onError without forwarding it to the View', () => {
    const onError = jest.fn();
    // Nothing in the fallback can fail the way native can, so there is no
    // honest error to report — but the prop must not leak onto the View.
    expect(render({ onError }).props.onError).toBeUndefined();
    expect(onError).not.toHaveBeenCalled();
  });

  it('does not forward glass-only props onto the View', () => {
    const { props } = render({
      variant: 'clear',
      intensity: 80,
      interactive: true,
      refraction: false,
    });
    expect(props.variant).toBeUndefined();
    expect(props.intensity).toBeUndefined();
    expect(props.interactive).toBeUndefined();
    expect(props.refraction).toBeUndefined();
  });

  it('forwards children and arbitrary ViewProps', () => {
    const { props } = render({ testID: 'glass-web', children: 'hi' });
    expect(props.testID).toBe('glass-web');
    expect(props.children).toBe('hi');
  });
});
