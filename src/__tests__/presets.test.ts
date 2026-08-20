import { GLASS_PRESET_NAMES, GlassPresets, resolvePreset } from '../presets';

describe('GlassPresets', () => {
  it('exposes every preset by name', () => {
    expect(GLASS_PRESET_NAMES).toStrictEqual([
      'navigationBar',
      'floatingTabBar',
      'cardOverMedia',
      'compactControl',
      'frosted',
      'toast',
      'crystal',
    ]);
  });

  it('freezes the map and every entry, since they are shared objects', () => {
    expect(Object.isFrozen(GlassPresets)).toBe(true);
    for (const name of GLASS_PRESET_NAMES) {
      expect(Object.isFrozen(GlassPresets[name])).toBe(true);
    }
  });

  it('keeps every preset value inside its documented range', () => {
    for (const name of GLASS_PRESET_NAMES) {
      const preset = GlassPresets[name];
      expect(preset.intensity).toBeGreaterThanOrEqual(0);
      expect(preset.intensity).toBeLessThanOrEqual(100);
      expect(preset.thickness).toBeGreaterThanOrEqual(0);
      expect(preset.thickness).toBeLessThanOrEqual(2);
      expect(preset.edgeReflectionStrength).toBeGreaterThanOrEqual(0);
      expect(preset.edgeReflectionStrength).toBeLessThanOrEqual(1);
      expect(preset.legibilityFloor).toBeGreaterThanOrEqual(0);
      expect(preset.legibilityFloor).toBeLessThanOrEqual(1);
      expect(preset.borderRadius).toBeGreaterThanOrEqual(0);
      expect(['regular', 'clear']).toContain(preset.variant);
    }
  });
});

describe('resolvePreset', () => {
  it('returns the props unchanged when no preset is given', () => {
    expect(resolvePreset({ intensity: 42 })).toStrictEqual({ intensity: 42 });
  });

  it('applies the preset values', () => {
    const resolved = resolvePreset({ preset: 'crystal' as const });
    expect(resolved).toStrictEqual(GlassPresets.crystal);
  });

  it('lets an explicit prop win over the preset', () => {
    const resolved = resolvePreset({
      preset: 'crystal' as const,
      intensity: 90,
    });
    expect(resolved.intensity).toBe(90);
    // Everything else still comes from the preset.
    expect(resolved.thickness).toBe(GlassPresets.crystal.thickness);
  });

  // The reason resolvePreset exists rather than a plain spread: an explicitly
  // undefined prop must NOT knock out the preset's value.
  it('ignores keys whose value is undefined', () => {
    const resolved = resolvePreset({
      preset: 'frosted' as const,
      intensity: undefined,
      variant: undefined,
    });
    expect(resolved.intensity).toBe(GlassPresets.frosted.intensity);
    expect(resolved.variant).toBe(GlassPresets.frosted.variant);
  });

  it('strips the `preset` key from its output', () => {
    expect('preset' in resolvePreset({ preset: 'frosted' as const })).toBe(false);
  });

  it('does not mutate the preset it read from', () => {
    const before = { ...GlassPresets.navigationBar };
    resolvePreset({ preset: 'navigationBar' as const, intensity: 1 });
    expect(GlassPresets.navigationBar).toStrictEqual(before);
  });

  it('falls through to the props when the preset name is unknown', () => {
    const resolved = resolvePreset({
      preset: 'nope' as never,
      intensity: 12,
    });
    expect(resolved).toStrictEqual({ intensity: 12 });
  });
});

describe('artistic preset values', () => {
  it('frosted carries grain — a heavy blur needs texture to read as glass', () => {
    expect(GlassPresets.frosted.grain).toBeGreaterThan(0);
  });

  it('crystal carries iridescence — it is the decorative preset', () => {
    expect(GlassPresets.crystal.iridescence).toBeGreaterThan(0);
  });

  it('leaves the chrome presets free of decoration', () => {
    // navigationBar and floatingTabBar sit under real content all day; grain
    // and iridescence there would be noise behind text.
    for (const name of ['navigationBar', 'floatingTabBar'] as const) {
      expect(GlassPresets[name].grain ?? 0).toBe(0);
      expect(GlassPresets[name].iridescence ?? 0).toBe(0);
    }
  });
});

describe('toast preset', () => {
  it('is the most legibility-protective preset — it renders over unknown content', () => {
    const toast = GlassPresets.toast;
    // Highest legibilityFloor of any preset: a toast must survive a white page.
    for (const name of GLASS_PRESET_NAMES) {
      if (name === 'toast') continue;
      expect(toast.legibilityFloor ?? 0).toBeGreaterThanOrEqual(
        GlassPresets[name].legibilityFloor ?? 0
      );
    }
    // Shallow lens: deep refraction on a 60dp strip warps its own text.
    expect(toast.thickness).toBeLessThanOrEqual(0.7);
    // Heavy-ish blur to quiet whatever is behind.
    expect(toast.intensity).toBeGreaterThanOrEqual(70);
  });

  it('resolves under user props like every other preset', () => {
    const resolved = resolvePreset({ preset: 'toast', borderRadius: 24 });
    expect(resolved.borderRadius).toBe(24); // explicit prop wins
    expect(resolved.legibilityFloor).toBe(GlassPresets.toast.legibilityFloor);
  });
});
