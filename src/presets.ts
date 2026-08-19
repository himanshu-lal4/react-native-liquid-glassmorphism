/**
 * Tuned starting points, so the common cases do not require reading the whole
 * prop table.
 *
 * A preset is a partial prop bag, resolved in JS as `{ ...preset, ...yourProps }`
 * — an explicitly passed prop always wins, so you can start from one and
 * override a single value.
 *
 * The maps are frozen: they are shared objects, and a consumer mutating one
 * would change every view that uses it.
 */

import type { LiquidGlassViewProps } from './types';

/**
 * The props a preset may set.
 *
 * Deliberately excludes `shape`, `style` and `children` — a preset describes the
 * *material*, not the silhouette or the layout.
 */
export type GlassPresetProps = Pick<
  LiquidGlassViewProps,
  | 'variant'
  | 'intensity'
  | 'thickness'
  | 'edgeReflectionStrength'
  | 'legibilityFloor'
  | 'borderRadius'
  | 'tilt'
>;

export const GlassPresets = Object.freeze({
  /**
   * A translucent header with content scrolling under it.
   *
   * Square corners because it is pinned to an edge, and a shallow lens: a deep
   * one on a full-width bar just smears the content behind it.
   */
  navigationBar: Object.freeze<GlassPresetProps>({
    variant: 'regular',
    intensity: 70,
    thickness: 0.6,
    edgeReflectionStrength: 0.4,
    legibilityFloor: 0.15,
    borderRadius: 0,
  }),

  /**
   * A detached, fully-rounded tab bar floating above content.
   *
   * This is where the effect earns its keep — full thickness and a live rim, so
   * it reads as a physical object sitting above the page.
   */
  floatingTabBar: Object.freeze<GlassPresetProps>({
    variant: 'regular',
    intensity: 65,
    thickness: 1,
    edgeReflectionStrength: 1,
    legibilityFloor: 0.2,
    borderRadius: 28,
  }),

  /**
   * A readable card over photography or video.
   *
   * `clear` keeps the artwork recognisable instead of averaging it into mush;
   * the legibility veil is what buys back text contrast.
   */
  cardOverMedia: Object.freeze<GlassPresetProps>({
    variant: 'clear',
    intensity: 45,
    thickness: 1.2,
    edgeReflectionStrength: 0.7,
    legibilityFloor: 0.35,
    borderRadius: 24,
  }),

  /**
   * A small pill — a chip, a badge, a floating control.
   *
   * Small surfaces need small numbers: a deep lens on a 40dp control swallows
   * the whole thing.
   */
  compactControl: Object.freeze<GlassPresetProps>({
    variant: 'clear',
    intensity: 50,
    thickness: 0.7,
    edgeReflectionStrength: 1,
    legibilityFloor: 0.25,
    borderRadius: 20,
  }),

  /**
   * Heavy, matte, almost opaque — a settings sheet or a modal backdrop, where
   * legibility matters more than seeing through.
   */
  frosted: Object.freeze<GlassPresetProps>({
    variant: 'regular',
    intensity: 85,
    thickness: 0.4,
    edgeReflectionStrength: 0.3,
    legibilityFloor: 0,
    borderRadius: 20,
  }),

  /**
   * Thin, hard and deeply refracting. Decorative — a hero element rather than
   * something to put a paragraph of text on.
   */
  crystal: Object.freeze<GlassPresetProps>({
    variant: 'clear',
    intensity: 30,
    thickness: 1.8,
    edgeReflectionStrength: 1,
    legibilityFloor: 0.1,
    borderRadius: 24,
  }),
});

export type GlassPresetName = keyof typeof GlassPresets;

/** Every preset name, for iterating in docs, demos and tests. */
export const GLASS_PRESET_NAMES = Object.freeze(Object.keys(GlassPresets) as GlassPresetName[]);

/**
 * Merge a preset under a set of explicitly passed props.
 *
 * Keys whose value is `undefined` are skipped rather than spread, because
 * `{ ...preset, ...props }` would let an absent-but-present key (`variant={cond
 * ? 'clear' : undefined}`) knock out the preset's value and fall through to the
 * component's own default instead.
 *
 * An unknown preset name resolves to the props unchanged; `validateGlassProps`
 * reports it in dev.
 */
export function resolvePreset<T extends GlassPresetProps & { preset?: GlassPresetName }>(
  props: T
): Omit<T, 'preset'> & GlassPresetProps {
  const { preset, ...rest } = props;
  const base = preset ? GlassPresets[preset] : undefined;
  if (!base) return rest;

  const merged: Record<string, unknown> = { ...base };
  for (const key of Object.keys(rest) as (keyof typeof rest)[]) {
    const value = rest[key];
    if (value !== undefined) merged[key as string] = value;
  }
  return merged as Omit<T, 'preset'> & GlassPresetProps;
}
