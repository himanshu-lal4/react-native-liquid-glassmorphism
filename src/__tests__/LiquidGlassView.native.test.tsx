/**
 * Unit tests for the native `<LiquidGlassView>` wrapper's prop mapping.
 *
 * These assert the contract between the friendly public props and the codegen
 * native component, without needing a renderer: the wrapper is a pure function
 * component, so we invoke it and inspect the returned React element.
 */
import { createElement } from 'react';

// Mock the codegen native component so importing the wrapper doesn't try to
// register a real Fabric component in the test environment.
jest.mock('../LiquidGlassmorphismViewNativeComponent', () => ({
  __esModule: true,
  default: 'LiquidGlassmorphismView',
}));

import { LiquidGlassView } from '../LiquidGlassView.native';
import NativeLiquidGlass from '../LiquidGlassmorphismViewNativeComponent';
import { GlassPresets } from '../presets';

const render = (props = {}) => LiquidGlassView(props as any) as any;

// One case below passes `refraction={false}`, which the dev validator
// correctly flags as inert under the jest preset's default 'ios' platform.
// That notice is covered by devValidate.test.ts; mute it here so this suite's
// output is about prop mapping only.
let warn: jest.SpyInstance;
beforeAll(() => {
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterAll(() => warn.mockRestore());

describe('LiquidGlassView (native) prop mapping', () => {
  it('renders the native codegen component', () => {
    expect(render().type).toBe(NativeLiquidGlass);
  });

  it('applies the documented defaults', () => {
    const { props } = render();
    expect(props.variant).toBe('regular');
    expect(props.intensity).toBe(60);
    expect(props.interactive).toBe(false);
    expect(props.refraction).toBe(true);
    expect(props.glassCornerRadius).toBe(0);
  });

  it('maps the public `borderRadius` prop onto native `glassCornerRadius`', () => {
    expect(render({ borderRadius: 24 }).props.glassCornerRadius).toBe(24);
  });

  // Regression: the native layer selects UIGlassEffect.Style from `variant`, so
  // the JS wrapper must forward it verbatim for both regular and clear.
  it.each(['regular', 'clear'] as const)(
    'forwards variant "%s" to the native component',
    (variant) => {
      expect(render({ variant }).props.variant).toBe(variant);
    }
  );

  it('also reflects borderRadius into the style so children clip to the curve', () => {
    const { props } = render({ borderRadius: 16, style: { padding: 8 } });
    expect(props.style).toStrictEqual([{ borderRadius: 16 }, { padding: 8 }]);
  });

  it('passes explicit values through, overriding defaults', () => {
    const { props } = render({
      variant: 'clear',
      intensity: 90,
      interactive: true,
      refraction: false,
      tintColor: '#FF0000',
    });
    expect(props.variant).toBe('clear');
    expect(props.intensity).toBe(90);
    expect(props.interactive).toBe(true);
    expect(props.refraction).toBe(false);
    expect(props.tintColor).toBe('#FF0000');
  });

  it('forwards children and arbitrary ViewProps (e.g. testID)', () => {
    const child = createElement('Text', null, 'hi');
    const { props } = render({ testID: 'glass', children: child });
    expect(props.testID).toBe('glass');
    expect(props.children).toBe(child);
  });

  // Custom shapes: the wrapper normalises to a path + view-box and stops
  // rounding the outer container (that would clip the shape's corners).
  it('sends no shape by default', () => {
    const { props } = render();
    expect(props.shapePath).toBe('');
    expect(props.shapeViewBoxWidth).toBe(0);
    expect(props.shapeViewBoxHeight).toBe(0);
  });

  it('normalises a `shape` prop into path + view-box props', () => {
    const { props } = render({ shape: { type: 'circle' } });
    expect(props.shapePath).toContain('M');
    expect(props.shapeViewBoxWidth).toBe(100);
    expect(props.shapeViewBoxHeight).toBe(100);
  });

  // Presets are resolved in JS before defaulting, so a preset value must reach
  // native while an explicitly passed prop still wins over it.
  it('applies a preset to the native props', () => {
    const { props } = render({ preset: 'crystal' });
    expect(props.variant).toBe(GlassPresets.crystal.variant);
    expect(props.intensity).toBe(GlassPresets.crystal.intensity);
  });

  it('lets an explicit prop override the preset', () => {
    const { props } = render({ preset: 'crystal', intensity: 90 });
    expect(props.intensity).toBe(90);
    expect(props.variant).toBe(GlassPresets.crystal.variant);
  });

  it('never forwards the `preset` prop itself to native', () => {
    expect(render({ preset: 'frosted' }).props.preset).toBeUndefined();
  });

  it('falls back to the documented defaults for an unknown preset', () => {
    const { props } = render({ preset: 'nope' });
    expect(props.intensity).toBe(60);
    expect(props.variant).toBe('regular');
  });

  // `paused` is Android-only; the jest preset reports 'ios', so it must be kept
  // off the native prop surface here alongside the other Android-only optics.
  it('does not send `paused` to native on iOS', () => {
    expect(render({ paused: true }).props.paused).toBeUndefined();
  });

  // Codegen event payloads cannot carry a union, so `tier` and `code` cross the
  // bridge as plain strings. The wrapper re-types them for the public handler —
  // it must not drop or reshape the event on the way through.
  it('forwards onPipelineReady with the payload intact', () => {
    const onPipelineReady = jest.fn();
    const event = {
      nativeEvent: {
        tier: 'refraction',
        osVersion: 34,
        shaderCompiled: true,
        supportsNativeGlass: false,
      },
    };
    render({ onPipelineReady }).props.onPipelineReady(event);
    expect(onPipelineReady).toHaveBeenCalledWith(event);
  });

  it('forwards onError with the payload intact', () => {
    const onError = jest.fn();
    const event = {
      nativeEvent: {
        code: 'INVALID_SHAPE',
        message: 'nope',
        fatal: false,
      },
    };
    render({ onError }).props.onError(event);
    expect(onError).toHaveBeenCalledWith(event);
  });

  it('passes no handler through when none was given, so native can skip the work', () => {
    const { props } = render();
    expect(props.onPipelineReady).toBeUndefined();
    expect(props.onError).toBeUndefined();
  });

  it('omits the container borderRadius when a shape is set', () => {
    const { props } = render({ shape: { type: 'circle' }, style: { padding: 8 } });
    // First slot is null (no rounding) rather than a { borderRadius } object.
    expect(props.style).toStrictEqual([null, { padding: 8 }]);
  });
});
