/**
 * Android-only wiring for the #49 smooth-min merge.
 *
 * Loaded against a minimal `react-native` mock rather than `requireActual`,
 * matching devValidate.test.ts: the real module pulls in TurboModules, which
 * do not exist under jest.
 */
// The modules under test are `require`d per case against a mocked react-native;
// this type-only import is what keeps the file a MODULE rather than a script,
// so its top-level consts do not collide with the other suites' globals.
import type { LiquidGlassViewProps } from '../types';

const loadAndroid = () => {
  jest.resetModules();
  jest.doMock('react-native', () => ({
    Platform: { OS: 'android', Version: 34 },
    StyleSheet: { absoluteFill: {}, create: (o: unknown) => o },
    View: 'View',
    useColorScheme: () => 'light',
  }));
  jest.doMock('../LiquidGlassmorphismViewNativeComponent', () => ({
    __esModule: true,
    default: 'LiquidGlassmorphismView',
  }));
  return require('../LiquidGlassView.native');
};

let warn: jest.SpyInstance;
beforeAll(() => {
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterAll(() => {
  warn.mockRestore();
  jest.resetModules();
});

const TRI = 'M 0 0 L 10 0 L 10 10 Z';
const pathShape = (): LiquidGlassViewProps['shape'] => ({
  type: 'path',
  d: TRI,
  width: 100,
  height: 100,
});

describe('secondaryShape (#49)', () => {
  it('sends the normalised secondary path and smoothing on Android', () => {
    const { renderNativeGlass } = loadAndroid();
    const el: any = renderNativeGlass({
      shape: pathShape(),
      secondaryShape: pathShape(),
      shapeSmoothing: 24,
    });
    expect(el.props.secondaryShapePath).toBeTruthy();
    expect(el.props.shapeSmoothing).toBe(24);
  });

  it('sends an empty secondary path when none is given', () => {
    const { renderNativeGlass } = loadAndroid();
    const el: any = renderNativeGlass({ shape: pathShape() });
    expect(el.props.secondaryShapePath).toBe('');
    expect(el.props.shapeSmoothing).toBe(0);
  });

  it('ignores a secondary with no primary — there is nothing to merge into', () => {
    // Both shapes share the primary's view-box, so a secondary alone has no
    // coordinate space to live in.
    const { renderNativeGlass } = loadAndroid();
    const el: any = renderNativeGlass({ secondaryShape: pathShape() });
    expect(el.props.secondaryShapePath).toBe('');
  });

  it('never leaks the merge props to iOS', () => {
    jest.resetModules();
    jest.doMock('react-native', () => ({
      Platform: { OS: 'ios', Version: 26 },
      StyleSheet: { absoluteFill: {}, create: (o: unknown) => o },
      View: 'View',
      useColorScheme: () => 'light',
    }));
    jest.doMock('../LiquidGlassmorphismViewNativeComponent', () => ({
      __esModule: true,
      default: 'LiquidGlassmorphismView',
    }));
    const { renderNativeGlass } = require('../LiquidGlassView.native');
    const el: any = renderNativeGlass({
      shape: pathShape(),
      secondaryShape: pathShape(),
      shapeSmoothing: 24,
    });
    expect(el.props.secondaryShapePath).toBeUndefined();
    expect(el.props.shapeSmoothing).toBeUndefined();
  });
});
