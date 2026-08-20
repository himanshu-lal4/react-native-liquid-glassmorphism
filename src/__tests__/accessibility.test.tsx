/**
 * Unit tests for the accessibility degradation.
 *
 * The mode/preference matrix lives in `resolveAccessibility`, which is pure —
 * so it is tested exhaustively here without a renderer. The gate component that
 * consumes it is thin glue over a subscription; testing it would need a React
 * renderer, which this project does not currently depend on.
 */
jest.mock('../LiquidGlassmorphismViewNativeComponent', () => ({
  __esModule: true,
  default: 'LiquidGlassmorphismView',
}));

import {
  DEFAULT_ACCESSIBILITY_STATE,
  DEFAULT_RESOLVED_ACCESSIBILITY,
  resolveAccessibility,
  type GlassAccessibilityState,
} from '../accessibility';
import { renderNativeGlass } from '../LiquidGlassView.native';

const state = (over: Partial<GlassAccessibilityState> = {}): GlassAccessibilityState => ({
  ...DEFAULT_ACCESSIBILITY_STATE,
  ...over,
});

const render = (props = {}, a11y = DEFAULT_RESOLVED_ACCESSIBILITY) =>
  renderNativeGlass(props as any, a11y) as any;

let warn: jest.SpyInstance;
beforeAll(() => {
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterAll(() => warn.mockRestore());

describe('resolveAccessibility', () => {
  it('defaults to auto when no mode is given', () => {
    expect(resolveAccessibility(undefined, state({ reduceTransparency: true })).opaque).toBe(true);
  });

  it('auto degrades to opaque only when transparency is reduced', () => {
    expect(resolveAccessibility('auto', state()).opaque).toBe(false);
    expect(resolveAccessibility('auto', state({ reduceTransparency: true })).opaque).toBe(true);
  });

  it('forceOpaque degrades regardless of preferences', () => {
    expect(resolveAccessibility('forceOpaque', state()).opaque).toBe(true);
    expect(resolveAccessibility('forceOpaque', state({ reduceTransparency: true })).opaque).toBe(
      true
    );
  });

  it('forceGlass keeps glass even when transparency is reduced', () => {
    expect(resolveAccessibility('forceGlass', state({ reduceTransparency: true })).opaque).toBe(
      false
    );
  });

  it('forceGlass does NOT override reduce motion', () => {
    // Overriding a look is a design call; continuing to animate at someone who
    // asked for stillness is not.
    expect(resolveAccessibility('forceGlass', state({ reduceMotion: true })).allowMotion).toBe(
      false
    );
  });

  it.each(['auto', 'forceGlass', 'forceOpaque'] as const)(
    'reduce motion suppresses motion in %s mode',
    (mode) => {
      expect(resolveAccessibility(mode, state({ reduceMotion: true })).allowMotion).toBe(false);
      expect(resolveAccessibility(mode, state()).allowMotion).toBe(true);
    }
  );

  it('falls back to auto for an unrecognised mode', () => {
    expect(
      resolveAccessibility('nonsense' as never, state({ reduceTransparency: true })).opaque
    ).toBe(true);
  });
});

describe('renderNativeGlass — accessibility', () => {
  it('drops tilt when motion is not allowed, so no sensor is registered', () => {
    const view = render({ tilt: true }, { opaque: false, allowMotion: false });
    expect(view.props.tilt).toBe(false);
  });

  it('keeps tilt when motion is allowed', () => {
    expect(render({ tilt: true }).props.tilt).toBe(true);
  });

  it('leaves interactive alone under reduce motion', () => {
    // Touch response is a reaction to something the user just did, not the
    // unbidden movement Reduce Motion is about.
    const view = render({ interactive: true }, { opaque: false, allowMotion: false });
    expect(view.props.interactive).toBe(true);
  });

  it('never forwards accessibilityMode to the native component', () => {
    const view = render({ accessibilityMode: 'forceGlass' });
    expect(view.props.accessibilityMode).toBeUndefined();
  });
});

describe('DEFAULT_RESOLVED_ACCESSIBILITY', () => {
  it('is full glass with motion, so a direct render is undegraded', () => {
    expect(DEFAULT_RESOLVED_ACCESSIBILITY).toStrictEqual({ opaque: false, allowMotion: true });
  });
});
