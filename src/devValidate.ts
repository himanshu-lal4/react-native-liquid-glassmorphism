/**
 * `__DEV__`-only prop validation.
 *
 * This layer exists because almost every bad value in this API fails *silently*.
 * Native clamps out-of-range numbers, so the prop simply reads as a no-op; a
 * `NaN` survives Kotlin's `coerceIn` unchanged; and props belonging to a
 * platform or a tier that is not active are ignored without comment.
 *
 * The ranges are also genuinely easy to confuse — `intensity` is 0–100 while
 * `thickness` is 0–2 and `legibilityFloor` is 0–1 — so the most common mistake
 * is passing a value in the wrong scale and getting silence.
 *
 * Every message is emitted at most once per key for the life of the JS context.
 * Callers must guard on `__DEV__`; nothing here is stripped on its own.
 */

import { Platform } from 'react-native';

import { getGlassCapabilities } from './capabilities';
import { GLASS_PRESET_NAMES } from './presets';
import type { LiquidGlassViewProps } from './types';
import { warnOnce } from './warnOnce';

const C = 'LiquidGlassView';

/** @returns whether the value is present and finite, warning if it is not. */
function checkFinite(name: string, value: number | undefined): boolean {
  if (value === undefined) return false;
  if (Number.isFinite(value)) return true;
  warnOnce(
    `${name}.finite`,
    `${C}: \`${name}\` received ${value}. Non-finite values are not clamped ` +
      'natively and produce undefined rendering — a common cause is a computed ' +
      'value like `borderRadius={size / 2}` where `size` is briefly undefined.'
  );
  return false;
}

function checkRange(
  name: string,
  value: number | undefined,
  [min, max]: readonly [number, number],
  note: string
): void {
  if (!checkFinite(name, value)) return;
  const v = value as number;
  if (v >= min && v <= max) return;
  warnOnce(
    `${name}.range`,
    `${C}: \`${name}\` should be between ${min} and ${max} (received ${v}). ${note}`
  );
}

/**
 * Catches the "I thought this was 0–1" mistake on a 0–100 prop, and its mirror
 * image on the 0–1 props.
 */
function checkScale(name: string, value: number | undefined, scale: '0-100' | '0-1'): void {
  if (value === undefined || !Number.isFinite(value)) return;

  if (scale === '0-100' && value > 0 && value <= 1) {
    warnOnce(
      `${name}.scale`,
      `${C}: \`${name}\` is on a 0–100 scale, so ${value} is being applied as ` +
        `${value} out of 100 — very nearly off. Did you mean ${value * 100}?`
    );
    return;
  }

  if (scale === '0-1' && value > 1) {
    warnOnce(
      `${name}.scale`,
      `${C}: \`${name}\` is on a 0–1 scale, not 0–100, so ${value} is clamped ` +
        `to 1. Did you mean ${value / 100}?`
    );
  }
}

/** Warn once that `name` does nothing on the current platform. */
function warnPlatformNoop(name: string, reason: string): void {
  warnOnce(
    `${name}.noop.${Platform.OS}`,
    `${C}: \`${name}\` has no effect on ${Platform.OS} — ${reason}. It is safe ` +
      'to pass in cross-platform code; this is a heads-up, not an error.'
  );
}

const ACCESSIBILITY_MODES = ['auto', 'forceGlass', 'forceOpaque'] as const;

/**
 * Validate the public props of `<LiquidGlassView>`.
 *
 * Call from the wrapper behind an `if (__DEV__)` guard, before any prop
 * defaulting — the point is to report what the caller actually passed.
 */
export function validateGlassProps(props: LiquidGlassViewProps): void {
  // --- units and ranges -----------------------------------------------------
  checkFinite('borderRadius', props.borderRadius);

  // A typo here fails open — an unrecognised mode falls through to `auto` —
  // which is the safe direction but silently ignores what was asked for.
  if (
    props.accessibilityMode !== undefined &&
    !ACCESSIBILITY_MODES.includes(props.accessibilityMode)
  ) {
    warnOnce(
      'accessibilityMode.unknown',
      `${C}: \`accessibilityMode\` expects ${ACCESSIBILITY_MODES.map((m) => `'${m}'`).join(
        ' | '
      )} (received ${JSON.stringify(props.accessibilityMode)}); treating it as 'auto'.`
    );
  }

  if (props.accessibilityMode === 'forceGlass') {
    warnOnce(
      'accessibilityMode.forceGlass',
      `${C}: \`accessibilityMode="forceGlass"\` overrides the user's Reduce Transparency preference. ` +
        `Only do this where the glass is decorative and something else already carries the meaning.`
    );
  }

  checkScale('intensity', props.intensity, '0-100');
  checkRange(
    'intensity',
    props.intensity,
    [0, 100],
    'Values outside this range are clamped natively, so the prop reads as a no-op.'
  );

  checkRange(
    'thickness',
    props.thickness,
    [0, 2],
    'Above ~2 the lens folds in on itself rather than getting deeper.'
  );

  checkScale('edgeReflectionStrength', props.edgeReflectionStrength, '0-1');
  checkRange(
    'edgeReflectionStrength',
    props.edgeReflectionStrength,
    [0, 1],
    'It is a 0–1 strength, where 1 is the default rim echo.'
  );

  checkScale('legibilityFloor', props.legibilityFloor, '0-1');
  checkRange(
    'legibilityFloor',
    props.legibilityFloor,
    [0, 1],
    'It is a 0–1 veil opacity, where 0 disables it.'
  );

  checkScale('iridescence', props.iridescence, '0-1');
  checkRange(
    'iridescence',
    props.iridescence,
    [0, 1],
    'It is a 0–1 strength, where 0 is off. Subtle values read best.'
  );

  checkRange(
    'grain',
    props.grain,
    [0, 0.15],
    'Above ~0.15 it stops reading as etched glass and starts reading as noise.'
  );

  checkRange(
    'specularSharpness',
    props.specularSharpness,
    [0.25, 4],
    'It multiplies the specular exponent; 1 is the default hotspot.'
  );

  checkRange(
    'saturation',
    props.saturation,
    [0, 2],
    'It multiplies the backdrop vibrancy; 1 is the default over-saturation.'
  );

  checkRange(
    'brightness',
    props.brightness,
    [0.5, 1.5],
    'It multiplies backdrop luminance; 1 is unchanged.'
  );

  checkFinite('lightAngle', props.lightAngle);

  if (props.borderRadius !== undefined && props.borderRadius < 0) {
    warnOnce(
      'borderRadius.negative',
      `${C}: \`borderRadius\` cannot be negative (received ${props.borderRadius}); it is clamped to 0.`
    );
  }

  // --- combinations that silently do nothing --------------------------------
  if (props.shape && props.borderRadius) {
    warnOnce(
      'shape.borderRadius',
      `${C}: \`borderRadius\` is ignored when \`shape\` is set — the shape ` +
        'defines the silhouette, including its corners. Remove one of the two.'
    );
  }

  if (props.preset && !GLASS_PRESET_NAMES.includes(props.preset)) {
    warnOnce(
      `preset.unknown.${String(props.preset)}`,
      `${C}: unknown preset "${String(props.preset)}"; it is ignored. Valid ` +
        `presets are ${GLASS_PRESET_NAMES.join(', ')}.`
    );
  }

  // --- platform and tier no-ops ---------------------------------------------
  checkPlatformNoops(props);
  checkTierNoops(props);
}

/**
 * Props that do nothing on the platform they were passed on.
 *
 * Sharing one component across platforms is the normal case, so each check
 * fires only when the value differs from the prop's default — passing
 * `thickness={1}` cross-platform changes nothing on either platform and is not
 * worth a line in anyone's console.
 */
function checkPlatformNoops(props: LiquidGlassViewProps): void {
  if (Platform.OS === 'ios') {
    // iOS glass optics are the OS's to render, so our Android-side dials are
    // inert there.
    if (props.tilt === true) {
      warnPlatformNoop('tilt', 'the OS renders the glass specular itself');
    }
    // `thickness={0}` IS honoured on iOS: with `rim` and `specular` off it is
    // the signal to drop Liquid Glass for a plain UIBlurEffect material. Only
    // the intermediate values are inert there.
    if (props.thickness !== undefined && props.thickness !== 1 && props.thickness !== 0) {
      warnPlatformNoop(
        'thickness',
        'UIGlassEffect fixes the glass optics — only 0 is meaningful here, as ' +
          'part of the plain-blur signal'
      );
    }
    if (props.edgeReflectionStrength !== undefined && props.edgeReflectionStrength !== 1) {
      warnPlatformNoop('edgeReflectionStrength', 'the rim is part of the system material');
    }
    if (props.legibilityFloor !== undefined && props.legibilityFloor !== 0) {
      warnPlatformNoop('legibilityFloor', 'the system material manages its own contrast');
    }
    if (props.refraction === false) {
      warnPlatformNoop('refraction', 'the OS renders refraction natively');
    }
    if (props.paused === true) {
      warnPlatformNoop('paused', 'the OS owns the material’s refresh');
    }
    // Look-shaping uniforms live inside the AGSL shader; UIGlassEffect exposes
    // no equivalent, so each is inert on iOS.
    const artistic: ReadonlyArray<[string, number | undefined, number]> = [
      ['iridescence', props.iridescence, 0],
      ['grain', props.grain, 0],
      ['lightAngle', props.lightAngle, 0],
      ['specularSharpness', props.specularSharpness, 1],
      ['saturation', props.saturation, 1],
      ['brightness', props.brightness, 1],
    ];
    for (const [name, value, dflt] of artistic) {
      if (value !== undefined && value !== dflt) {
        warnPlatformNoop(name, 'UIGlassEffect renders the material itself');
      }
    }
  }
}

/**
 * Props the device is too old to honour.
 *
 * These are the cases where nothing throws, nothing logs, and the view simply
 * renders a tier lower than the props describe.
 */
function checkTierNoops(props: LiquidGlassViewProps): void {
  const caps = getGlassCapabilities();
  if (!caps.supported) return;

  if (props.shape && !caps.supportsShapes) {
    warnOnce(
      'shape.tier',
      `${C}: custom shapes need the signed-distance-field path (Android API ` +
        `33+); this device reports API ${caps.osVersion}, so the silhouette ` +
        'still clips but renders as a path-clipped frost without lens optics.'
    );
  }

  if (props.tilt && Platform.OS === 'android' && !caps.supportsRefraction) {
    warnOnce(
      'tilt.tier',
      `${C}: \`tilt\` drives a shader specular that needs Android API 33+; ` +
        `this device reports API ${caps.osVersion}, so the motion sensor would ` +
        'be registered for nothing. It is left off.'
    );
  }
}
