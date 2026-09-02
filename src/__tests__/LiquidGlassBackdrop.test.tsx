/**
 * `<LiquidGlassBackdrop>` is an Android rendering strategy. On every other
 * platform it must be a plain `View`, so one tree works everywhere.
 */
jest.mock('../LiquidGlassBackdropNativeComponent', () => ({
  __esModule: true,
  default: 'LiquidGlassBackdrop',
}));

// The module under test is `require`d per case against a mocked Platform;
// this type-only import is what keeps the file a module.
import type { LiquidGlassBackdropProps } from '../LiquidGlassBackdrop';

type BackdropModule = typeof import('../LiquidGlassBackdrop.native');
const props = (p: LiquidGlassBackdropProps) => p;

function loadFor(os: string): BackdropModule {
  jest.resetModules();
  jest.doMock('react-native', () => ({ Platform: { OS: os }, View: 'View' }));
  return require('../LiquidGlassBackdrop.native');
}

afterEach(() => {
  jest.resetModules();
  jest.dontMock('react-native');
});

describe('LiquidGlassBackdrop', () => {
  it('renders the native backdrop on Android', () => {
    const { LiquidGlassBackdrop } = loadFor('android');
    const el = LiquidGlassBackdrop(props({ testID: 'b' })) as any;
    expect(el.type).toBe('LiquidGlassBackdrop');
    expect(el.props.testID).toBe('b');
  });

  it('is a plain View on iOS, props forwarded', () => {
    const { LiquidGlassBackdrop } = loadFor('ios');
    const el = LiquidGlassBackdrop(props({ testID: 'b', style: { flex: 1 } })) as any;
    expect(el.type).toBe('View');
    expect(el.props.style).toEqual({ flex: 1 });
  });
});
