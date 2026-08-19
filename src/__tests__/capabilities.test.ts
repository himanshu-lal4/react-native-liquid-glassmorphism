/**
 * `getGlassCapabilities()` is pure `Platform` arithmetic, so every branch is
 * exercised by re-requiring the module against a mocked platform.
 */

// The module under test is `require`d per case against a mocked Platform; this
// type-only import is what keeps the file a module (and its helpers file-scoped).
import type { GlassCapabilities } from '../capabilities';

type CapabilitiesModule = typeof import('../capabilities');

function loadFor(os: string, version: number | string): CapabilitiesModule {
  jest.resetModules();
  jest.doMock('react-native', () => ({ Platform: { OS: os, Version: version } }));
  return require('../capabilities');
}

afterEach(() => {
  jest.resetModules();
  jest.dontMock('react-native');
});

describe('getGlassCapabilities', () => {
  it('reports real UIGlassEffect on iOS 26+', () => {
    const caps: GlassCapabilities = loadFor('ios', '26.1').getGlassCapabilities();
    expect(caps).toStrictEqual({
      supported: true,
      tier: 'glass',
      osVersion: 26,
      supportsNativeGlass: true,
      supportsBlur: true,
      supportsRefraction: true,
      supportsShapes: true,
    });
  });

  it('falls back to the blur material below iOS 26', () => {
    const caps = loadFor('ios', '18.4').getGlassCapabilities();
    expect(caps.tier).toBe('blur');
    expect(caps.supportsNativeGlass).toBe(false);
    expect(caps.supportsBlur).toBe(true);
    // No UIGlassEffect means no OS-rendered refraction.
    expect(caps.supportsRefraction).toBe(false);
    // Shapes are a CAShapeLayer mask, which works on every supported iOS.
    expect(caps.supportsShapes).toBe(true);
  });

  it('parses the iOS version string down to its major component', () => {
    expect(loadFor('ios', '15.0').getGlassCapabilities().osVersion).toBe(15);
    expect(loadFor('ios', '26').getGlassCapabilities().osVersion).toBe(26);
  });

  it.each([
    { api: 34, tier: 'refraction', blur: true, lens: true },
    { api: 33, tier: 'refraction', blur: true, lens: true },
    { api: 32, tier: 'blur', blur: true, lens: false },
    { api: 31, tier: 'blur', blur: true, lens: false },
    { api: 30, tier: 'tint', blur: false, lens: false },
    { api: 24, tier: 'tint', blur: false, lens: false },
  ])('maps Android API $api to the $tier tier', ({ api, tier, blur, lens }) => {
    const caps = loadFor('android', api).getGlassCapabilities();
    expect(caps.tier).toBe(tier);
    expect(caps.supported).toBe(true);
    expect(caps.supportsBlur).toBe(blur);
    // Refraction and shapes both ride on the same AGSL lens pipeline.
    expect(caps.supportsRefraction).toBe(lens);
    expect(caps.supportsShapes).toBe(lens);
    // There is no UIGlassEffect on Android at any tier.
    expect(caps.supportsNativeGlass).toBe(false);
  });

  it('reports nothing supported on web', () => {
    const { getGlassCapabilities, isLiquidGlassSupported } = loadFor('web', 0);
    expect(getGlassCapabilities().tier).toBe('none');
    expect(getGlassCapabilities().supported).toBe(false);
    expect(isLiquidGlassSupported()).toBe(false);
  });

  it('returns a frozen object, so a caller cannot corrupt a later read', () => {
    const { getGlassCapabilities } = loadFor('android', 33);
    expect(Object.isFrozen(getGlassCapabilities())).toBe(true);
  });

  it('re-reads Platform on every call rather than caching at import', () => {
    const module = loadFor('android', 33);
    expect(module.getGlassCapabilities().tier).toBe('refraction');
    // Same module instance, mutated platform — the second call must see it.
    const { Platform } = require('react-native');
    Platform.Version = 30;
    expect(module.getGlassCapabilities().tier).toBe('tint');
  });

  it('survives a non-numeric version rather than reporting NaN', () => {
    const caps = loadFor('android', 'unknown').getGlassCapabilities();
    expect(caps.osVersion).toBe(0);
    expect(caps.tier).toBe('tint');
  });
});
