/**
 * The validation layer's whole job is to turn silent no-ops into a warning, so
 * these tests assert on what reaches `console.warn`.
 */

// The modules under test are `require`d per case against a mocked Platform;
// this type-only import is what keeps the file a module.
import type { LiquidGlassViewProps } from '../types';

type DevValidateModule = typeof import('../devValidate');
type WarnOnceModule = typeof import('../warnOnce');

let warn: jest.SpyInstance;

function loadFor(os: string, version: number | string): DevValidateModule & WarnOnceModule {
  jest.resetModules();
  jest.doMock('react-native', () => ({ Platform: { OS: os, Version: version } }));
  return { ...require('../devValidate'), ...require('../warnOnce') };
}

/** Every warning emitted so far, joined — enough to assert content on. */
const warnings = () => warn.mock.calls.map((call) => String(call[0])).join('\n');

beforeEach(() => {
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  warn.mockRestore();
  jest.resetModules();
  jest.dontMock('react-native');
});

describe('validateGlassProps — ranges and scales', () => {
  it('says nothing about valid props', () => {
    const { validateGlassProps } = loadFor('android', 34);
    const props: LiquidGlassViewProps = {
      intensity: 60,
      thickness: 1,
      edgeReflectionStrength: 0.5,
      legibilityFloor: 0.2,
      borderRadius: 16,
    };
    validateGlassProps(props);
    expect(warn).not.toHaveBeenCalled();
  });

  it('catches a 0–1 value passed to the 0–100 `intensity`', () => {
    const { validateGlassProps } = loadFor('android', 34);
    validateGlassProps({ intensity: 0.6 });
    expect(warnings()).toContain('Did you mean 60');
  });

  it('catches a 0–100 value passed to a 0–1 prop', () => {
    const { validateGlassProps } = loadFor('android', 34);
    validateGlassProps({ legibilityFloor: 50 });
    expect(warnings()).toContain('Did you mean 0.5');
  });

  it.each([
    ['intensity', 140],
    ['thickness', 5],
    ['edgeReflectionStrength', 3],
    ['legibilityFloor', 9],
  ])('warns that an out-of-range `%s` is clamped', (name, value) => {
    const { validateGlassProps } = loadFor('android', 34);
    validateGlassProps({ [name]: value });
    expect(warnings()).toContain(`\`${name}\``);
  });

  it.each([NaN, Infinity])('warns about the non-finite value %p', (value) => {
    const { validateGlassProps } = loadFor('android', 34);
    validateGlassProps({ borderRadius: value });
    expect(warnings()).toContain('Non-finite');
  });

  it('warns about a negative borderRadius', () => {
    const { validateGlassProps } = loadFor('android', 34);
    validateGlassProps({ borderRadius: -8 });
    expect(warnings()).toContain('cannot be negative');
  });
});

describe('validateGlassProps — combinations', () => {
  it('warns that borderRadius is ignored alongside a shape', () => {
    const { validateGlassProps } = loadFor('android', 34);
    validateGlassProps({ shape: { type: 'circle' }, borderRadius: 12 });
    expect(warnings()).toContain('ignored when `shape` is set');
  });

  it('stays quiet for a shape with no borderRadius', () => {
    const { validateGlassProps } = loadFor('android', 34);
    validateGlassProps({ shape: { type: 'circle' } });
    expect(warn).not.toHaveBeenCalled();
  });

  it('names the valid presets when given an unknown one', () => {
    const { validateGlassProps } = loadFor('android', 34);
    validateGlassProps({ preset: 'sparkly' as never });
    expect(warnings()).toContain('unknown preset "sparkly"');
    expect(warnings()).toContain('floatingTabBar');
  });
});

describe('validateGlassProps — platform and tier no-ops', () => {
  it.each(['tilt', 'thickness', 'edgeReflectionStrength', 'legibilityFloor'])(
    'flags `%s` as inert on iOS',
    (name) => {
      const { validateGlassProps } = loadFor('ios', '26.0');
      validateGlassProps({ [name]: name === 'tilt' ? true : 0.5 });
      expect(warnings()).toContain('no effect on ios');
    }
  );

  it('does not flag those props on Android, where they do work', () => {
    const { validateGlassProps } = loadFor('android', 34);
    validateGlassProps({
      tilt: true,
      thickness: 0.5,
      legibilityFloor: 0.5,
      paused: true,
    });
    expect(warn).not.toHaveBeenCalled();
  });

  it('flags `paused` as inert on iOS', () => {
    const { validateGlassProps } = loadFor('ios', '26.0');
    validateGlassProps({ paused: true });
    expect(warnings()).toContain('`paused` has no effect on ios');
  });

  // Sharing one component across platforms is the normal case; a prop sitting
  // at its default changes nothing on either platform and must stay silent.
  // `thickness={0}` is honoured on iOS — it is part of the plain-blur signal —
  // so flagging it as inert would send people away from the working recipe.
  it('does not flag thickness={0} on iOS', () => {
    const { validateGlassProps } = loadFor('ios', '26.0');
    validateGlassProps({ thickness: 0, rim: false, specular: false });
    expect(warn).not.toHaveBeenCalled();
  });

  it('stays quiet on iOS for Android-only props left at their defaults', () => {
    const { validateGlassProps } = loadFor('ios', '26.0');
    validateGlassProps({
      tilt: false,
      thickness: 1,
      edgeReflectionStrength: 1,
      legibilityFloor: 0,
      refraction: true,
    });
    expect(warn).not.toHaveBeenCalled();
  });

  it('explains that a shape below API 33 loses its lens optics', () => {
    const { validateGlassProps } = loadFor('android', 31);
    validateGlassProps({ shape: { type: 'circle' } });
    expect(warnings()).toContain('path-clipped frost');
  });

  it('explains that tilt below API 33 would register a sensor for nothing', () => {
    const { validateGlassProps } = loadFor('android', 30);
    validateGlassProps({ tilt: true });
    expect(warnings()).toContain('API 33+');
  });

  it('says nothing about tier on an unsupported platform', () => {
    const { validateGlassProps } = loadFor('web', 0);
    validateGlassProps({ shape: { type: 'circle' } });
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('warnOnce', () => {
  it('emits each distinct message once, however many renders happen', () => {
    const { validateGlassProps } = loadFor('android', 34);
    for (let i = 0; i < 10; i++) validateGlassProps({ intensity: 0.6 });
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('still reports a different problem after the first', () => {
    const { validateGlassProps } = loadFor('android', 34);
    validateGlassProps({ intensity: 0.6 });
    validateGlassProps({ borderRadius: -1 });
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('prefixes messages with the package name so they are greppable', () => {
    const { validateGlassProps } = loadFor('android', 34);
    validateGlassProps({ intensity: 0.6 });
    expect(warnings()).toContain('[react-native-liquid-glassmorphism]');
  });
});
