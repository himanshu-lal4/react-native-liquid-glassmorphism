/**
 * Accessibility degradation for the glass material.
 *
 * A translucent, refracting, moving surface is exactly what a user who has
 * turned on Reduce Transparency is asking not to see. This module reads the
 * platform's preferences, keeps them live, and resolves them into the two
 * decisions the renderers need: whether to draw an opaque surface instead of
 * glass, and whether motion-driven effects are allowed.
 *
 * Everything here is JS. React Native already surfaces every signal we need on
 * both platforms, and the degraded state is expressible with props we already
 * have — so there is nothing to add natively, and the behaviour is identical
 * across iOS, Android and the web fallback.
 */
import { useEffect, useState } from 'react';
import { AccessibilityInfo, AppState, Platform } from 'react-native';

/**
 * How this view should respond to the user's accessibility preferences.
 *
 * - `auto` — honour them. Degrades to an opaque surface when the platform asks
 *   for reduced transparency, and drops motion-driven effects under Reduce
 *   Motion. **This is the default.**
 * - `forceGlass` — always render glass, overriding the user's stated
 *   preference. Only correct when the glass is decorative and something else
 *   already carries the meaning; see the README before reaching for it.
 * - `forceOpaque` — always render the opaque surface, regardless of settings.
 *   Useful for a screen where legibility is non-negotiable.
 */
export type GlassAccessibilityMode = 'auto' | 'forceGlass' | 'forceOpaque';

/**
 * The platform preferences that affect the glass, read live.
 */
export type GlassAccessibilityState = Readonly<{
  /**
   * The user wants less translucency.
   *
   * iOS reports this directly as Reduce Transparency. Android has no equivalent
   * setting, so the closest honest signal is high-contrast text — a user who
   * has asked for maximum text contrast is not well served by text on a
   * refracting backdrop.
   */
  reduceTransparency: boolean;
  /** The user wants less motion. Suppresses tilt and touch-driven specular. */
  reduceMotion: boolean;
}>;

export const DEFAULT_ACCESSIBILITY_STATE: GlassAccessibilityState = Object.freeze({
  reduceTransparency: false,
  reduceMotion: false,
});

/**
 * What the renderers actually branch on.
 */
export type ResolvedAccessibility = Readonly<{
  /** Draw an opaque surface instead of the glass material. */
  opaque: boolean;
  /** Ambient, sensor-driven motion (`tilt`) is permitted. */
  allowMotion: boolean;
}>;

/**
 * "No preferences set" — full glass, motion allowed.
 *
 * The renderers default to this so they stay directly callable as pure
 * functions in unit tests, without a renderer or a subscription.
 */
export const DEFAULT_RESOLVED_ACCESSIBILITY: ResolvedAccessibility = Object.freeze({
  opaque: false,
  allowMotion: true,
});

/**
 * Fold the mode and the live platform state into the two render decisions.
 *
 * Pure, so it can be unit-tested without a renderer or a native module.
 *
 * Note that `forceGlass` overrides transparency but **not** Reduce Motion:
 * choosing to keep a decorative material is a design call, whereas continuing
 * to animate it at someone who asked for stillness is not.
 */
export function resolveAccessibility(
  mode: GlassAccessibilityMode | undefined,
  state: GlassAccessibilityState
): ResolvedAccessibility {
  const allowMotion = !state.reduceMotion;

  switch (mode) {
    case 'forceOpaque':
      return { opaque: true, allowMotion };
    case 'forceGlass':
      return { opaque: false, allowMotion };
    case 'auto':
    case undefined:
    default:
      return { opaque: state.reduceTransparency, allowMotion };
  }
}

/**
 * Read the transparency preference for this platform.
 *
 * Guarded with `typeof` rather than a platform check alone: these APIs have
 * arrived at different times, and an older React Native missing one should
 * degrade to "no preference" rather than throw.
 */
async function readReduceTransparency(): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      const fn = AccessibilityInfo.isHighTextContrastEnabled;
      return typeof fn === 'function' ? await fn.call(AccessibilityInfo) : false;
    }
    const fn = AccessibilityInfo.isReduceTransparencyEnabled;
    return typeof fn === 'function' ? await fn.call(AccessibilityInfo) : false;
  } catch {
    return false;
  }
}

async function readReduceMotion(): Promise<boolean> {
  try {
    const fn = AccessibilityInfo.isReduceMotionEnabled;
    return typeof fn === 'function' ? await fn.call(AccessibilityInfo) : false;
  } catch {
    return false;
  }
}

/**
 * Subscribe to an `AccessibilityInfo` event, tolerating an event name the
 * running platform does not publish.
 *
 * Returns a no-op unsubscribe when the event is unsupported, so callers do not
 * have to branch.
 */
function subscribe(event: string, handler: (value: boolean) => void): () => void {
  try {
    const sub = AccessibilityInfo.addEventListener(
      event as Parameters<typeof AccessibilityInfo.addEventListener>[0],
      handler as never
    );
    return () => sub?.remove?.();
  } catch {
    return () => {};
  }
}

/**
 * The live accessibility state, kept in sync while the app runs.
 *
 * Three sources, because no single one is sufficient:
 *
 * 1. An initial async read, so the first paint is correct rather than
 *    optimistic.
 * 2. Change events, for a setting toggled while the app is foregrounded.
 * 3. An `AppState` re-read on `active` — the important one. Users change these
 *    settings in Settings, which backgrounds the app, and not every platform
 *    reliably delivers a change event across that transition. This is why no
 *    imperative `refreshAccessibilityState()` command is needed.
 */
export function useGlassAccessibilityState(): GlassAccessibilityState {
  const [state, setState] = useState<GlassAccessibilityState>(DEFAULT_ACCESSIBILITY_STATE);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      const [reduceTransparency, reduceMotion] = await Promise.all([
        readReduceTransparency(),
        readReduceMotion(),
      ]);
      if (cancelled) return;
      // Replace only on a real change, so an unrelated AppState churn does not
      // re-render every glass view in the tree.
      setState((prev) =>
        prev.reduceTransparency === reduceTransparency && prev.reduceMotion === reduceMotion
          ? prev
          : { reduceTransparency, reduceMotion }
      );
    };

    refresh();

    const unsubscribers = [
      subscribe('reduceTransparencyChanged', (reduceTransparency) =>
        setState((prev) =>
          prev.reduceTransparency === reduceTransparency ? prev : { ...prev, reduceTransparency }
        )
      ),
      subscribe('highTextContrastChanged', (reduceTransparency) =>
        setState((prev) =>
          Platform.OS !== 'android' || prev.reduceTransparency === reduceTransparency
            ? prev
            : { ...prev, reduceTransparency }
        )
      ),
      subscribe('reduceMotionChanged', (reduceMotion) =>
        setState((prev) => (prev.reduceMotion === reduceMotion ? prev : { ...prev, reduceMotion }))
      ),
    ];

    const appStateSub = AppState.addEventListener('change', (next) => {
      if (next === 'active') refresh();
    });

    return () => {
      cancelled = true;
      for (const off of unsubscribers) off();
      appStateSub?.remove?.();
    };
  }, []);

  return state;
}
