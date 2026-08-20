/** #48 — the progressive edge blur component. */
import type { ScrollEdgeBlurViewProps } from '../ScrollEdgeBlurView';

const loadNative = () => {
  jest.resetModules();
  jest.doMock('./../ScrollEdgeBlurViewNativeComponent', () => ({
    __esModule: true,
    default: 'ScrollEdgeBlurView',
  }));
  return require('../ScrollEdgeBlurView.native');
};

const loadWeb = () => {
  jest.resetModules();
  return require('../ScrollEdgeBlurView.tsx');
};

afterEach(() => jest.resetModules());

describe('ScrollEdgeBlurView (native)', () => {
  it('defaults to a top edge with a 24dp radius across the full view', () => {
    const { ScrollEdgeBlurView } = loadNative();
    const el: any = ScrollEdgeBlurView({} as ScrollEdgeBlurViewProps);
    expect(el.props.edge).toBe('top');
    expect(el.props.maxBlurRadius).toBe(24);
    expect(el.props.falloff).toBe(1);
  });

  it('passes through explicit props', () => {
    const { ScrollEdgeBlurView } = loadNative();
    const el: any = ScrollEdgeBlurView({
      edge: 'bottom',
      maxBlurRadius: 40,
      falloff: 0.5,
    });
    expect(el.props.edge).toBe('bottom');
    expect(el.props.maxBlurRadius).toBe(40);
    expect(el.props.falloff).toBe(0.5);
  });

  it('never intercepts touches — content scrolls underneath it', () => {
    const { ScrollEdgeBlurView } = loadNative();
    const el: any = ScrollEdgeBlurView({});
    expect(el.props.pointerEvents).toBe('none');
  });
});

describe('ScrollEdgeBlurView (web fallback)', () => {
  it('drops the native-only props rather than leaking them onto a View', () => {
    const { ScrollEdgeBlurView } = loadWeb();
    const el: any = ScrollEdgeBlurView({
      edge: 'bottom',
      maxBlurRadius: 40,
      falloff: 0.5,
      testID: 'edge',
    });
    expect(el.props.edge).toBeUndefined();
    expect(el.props.maxBlurRadius).toBeUndefined();
    expect(el.props.falloff).toBeUndefined();
    expect(el.props.testID).toBe('edge');
  });
});
