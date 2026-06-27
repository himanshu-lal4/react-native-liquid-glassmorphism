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

  it('applies borderRadius', () => {
    expect(flatStyle(render({ borderRadius: 20 })).borderRadius).toBe(20);
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
