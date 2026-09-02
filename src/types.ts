import type { ColorValue, NativeSyntheticEvent, ViewProps } from 'react-native';

import type { GlassAccessibilityMode } from './accessibility';
import type { GlassTier } from './capabilities';
import type { GlassPresetName } from './presets';
import type { LiquidGlassShape } from './shapes';

export type { LiquidGlassShape } from './shapes';
export type { GlassAccessibilityMode } from './accessibility';

/**
 * What `onPipelineReady` reports: the tier that **actually rendered**, not what
 * the device is capable of. `getGlassCapabilities()` answers the latter.
 */
export type GlassPipelineInfo = Readonly<{
  /** The path this view really took. See {@link GlassTier}. */
  tier: GlassTier;
  /** Android API level, or the iOS major version. */
  osVersion: number;
  /** Android: whether the AGSL shader compiled. Always `false` on iOS. */
  shaderCompiled: boolean;
  /** Whether the OS rendered the glass itself (iOS 26 `UIGlassEffect`). */
  supportsNativeGlass: boolean;
}>;

/**
 * Why a view is not doing what its props asked for.
 *
 * - `SHADER_COMPILE_FAILED` — the AGSL would not compile; the view fell back a
 *   tier. Non-fatal.
 * - `PIPELINE_DEGRADED` — the OS version cannot run the requested tier.
 * - `INVALID_SHAPE` — the `shape` path could not be parsed; the view fell back
 *   to a rounded rectangle.
 * - `BACKDROP_CAPTURE_FAILED` — a view behind the glass refused a software
 *   draw, so the previous backdrop is being reused.
 * - `GLASS_UNAVAILABLE` — iOS below 26, so a `UIBlurEffect` material is
 *   standing in for `UIGlassEffect`.
 */
export type GlassErrorCode =
  | 'SHADER_COMPILE_FAILED'
  | 'PIPELINE_DEGRADED'
  | 'INVALID_SHAPE'
  | 'BACKDROP_CAPTURE_FAILED'
  | 'GLASS_UNAVAILABLE';

export type GlassErrorInfo = Readonly<{
  code: GlassErrorCode;
  message: string;
  /**
   * Whether the view gave up entirely. Almost always `false` — the view
   * recovered — but it still means the glass is not what the props describe.
   */
  fatal: boolean;
}>;

/**
 * Glass material style.
 *
 * - `regular` — adaptive frosted glass. Maps to iOS 26 `UIGlassEffect` regular
 *   style (or `UIBlurEffect` material below 26) and a medium-strength blur on
 *   Android.
 * - `clear` — lighter, more transparent glass, ideal over photos/video.
 */
export type GlassVariant = 'regular' | 'clear';

/**
 * What `onFrameStats` reports, aggregated over one `frameStatsInterval` window.
 *
 * The timings are **CPU-side** — the backdrop capture and the render-node /
 * uniform work. GPU shader execution is not visible from the view, so this
 * measures the cost the library controls, not total frame cost.
 */
export type GlassFrameStats = Readonly<{
  /** Frames drawn per second across the window. */
  drawFps: number;
  /** Mean CPU cost per frame, in ms. */
  totalMs: number;
  /**
   * Worst single frame in the window, in ms.
   *
   * Read this rather than {@link totalMs} when hunting jank: one 40ms spike
   * vanishes into a 250ms average, which is exactly the frame you care about.
   */
  maxTotalMs: number;
  /** Mean time in the backdrop capture, in ms. Usually the dominant cost. */
  captureMs: number;
  /** Mean time recording the render node and uploading uniforms, in ms. */
  shaderMs: number;
  /** The tier that rendered these frames. */
  tier: GlassTier;
  /** Backdrop bitmap dimensions — capture cost scales with these. */
  capturedWidth: number;
  capturedHeight: number;
}>;

export interface LiquidGlassViewProps extends ViewProps {
  /**
   * Start from a tuned material instead of dialling the individual knobs.
   *
   * Resolved in JS as `{ ...GlassPresets[preset], ...yourProps }`, so any prop
   * you pass explicitly always wins. The raw map is exported as `GlassPresets`
   * if you want to read or extend the values.
   *
   * @example
   * <LiquidGlassView preset="floatingTabBar" borderRadius={32} />
   */
  preset?: GlassPresetName;

  /**
   * How this view responds to the user's accessibility preferences.
   *
   * - `auto` (default) — honour them. Renders an **opaque** surface instead of
   *   glass when the platform asks for reduced transparency (iOS Reduce
   *   Transparency; on Android, high-contrast text, which is the closest
   *   equivalent), and drops motion-driven effects under Reduce Motion.
   * - `forceGlass` — always render glass, overriding a stated user preference.
   *   Only correct where the glass is decorative and something else already
   *   carries the meaning. It does **not** override Reduce Motion.
   * - `forceOpaque` — always render the opaque surface.
   *
   * The preference is read live: change events plus a re-read whenever the app
   * returns to the foreground, so toggling the setting in Settings takes effect
   * on return without any imperative refresh call.
   *
   * @default 'auto'
   */
  accessibilityMode?: GlassAccessibilityMode;

  /**
   * Glass material style.
   * @default 'regular'
   */
  variant?: GlassVariant;

  /**
   * Tint color layered over the blurred backdrop. Accepts any RN color value.
   * Use an `rgba()`/8-digit hex with alpha to control tint strength.
   */
  tintColor?: ColorValue;

  /**
   * Blur / material strength, `0`–`100`.
   *
   * On iOS 26 the system manages the glass material, so this is only used for
   * the pre-26 `UIBlurEffect` fallback. On Android it scales the RenderEffect
   * blur radius.
   * @default 60
   */
  intensity?: number;

  /**
   * Draw the bright glass edge.
   *
   * Set `false`, together with `specular={false}` and `thickness={0}`, to get a
   * plain blurred pane — a drop-in for a conventional blur view:
   *
   * ```tsx
   * <LiquidGlassView rim={false} specular={false} thickness={0} blurRadius={20} />
   * ```
   *
   * On iOS the edge belongs to the system material and cannot be dialled — but
   * turning this off, together with `specular` and `thickness={0}`, tells iOS
   * you no longer want Liquid Glass at all, and it renders a plain
   * `UIBlurEffect` material instead.
   * @default true
   */
  rim?: boolean;

  /**
   * Draw the moving sheen and specular hotspot. `false` removes every
   * light-driven highlight, leaving a flat material.
   *
   * On iOS, part of the "this is not glass" signal — see {@link rim}.
   * @default true
   */
  specular?: boolean;

  /**
   * A flat dimming scrim over the backdrop, `0`–`1`, drawn under the children.
   *
   * This is the modal-overlay / backdrop primitive: a full-screen
   * `<LiquidGlassView dim={0.4} blurRadius={24} rim={false} />` behind a sheet
   * gives you the blurred, darkened backdrop that pattern wants.
   *
   * Distinct from {@link legibilityFloor}, which is adaptive and exists to keep
   * chrome legible; `dim` is constant and is a design choice about the surface.
   *
   * Works on both platforms.
   * @default 0
   */
  dim?: number;

  /**
   * An explicit blur radius in dp, overriding whatever
   * {@link intensity} would have derived.
   *
   * Reach for this when `intensity` isn't giving you the control you need —
   * most often on `clear` glass, which deliberately blurs far less than
   * `regular` and so spans a much narrower range across the whole 0–100
   * intensity scale. `blurRadius` ignores that scaling and gives both variants
   * the same units.
   *
   * Useful range is roughly `0`–`30`; `0` is a genuinely unblurred pane.
   *
   * Honoured on both platforms, including on real Liquid Glass. UIKit exposes
   * no blur radius on `UIGlassEffect`, so on iOS the backdrop is blurred
   * underneath the glass and the glass refracts the already-blurred result.
   * Measured against the Android shader across 0–25dp, the two track closely.
   *
   * In plain-blur mode (see {@link rim}) iOS picks the nearest `UIBlurEffect`
   * material instead; those are discrete, so it is the closest equivalent
   * rather than a literal radius.
   *
   * @example
   * // Clear glass — transparent and refractive, but properly blurred.
   * <LiquidGlassView variant="clear" blurRadius={16} />
   */
  blurRadius?: number;

  /**
   * Make the glass react to touch — iOS 26 interactive `UIGlassEffect`, and a
   * touch-following specular highlight on Android.
   * @default false
   */
  interactive?: boolean;

  /**
   * Android only: device-tilt specular driven by the gyro/accelerometer.
   *
   * Decoupled from {@link interactive} so you can have touch response *without*
   * an always-on motion sensor. The sensor is registered only while this is
   * `true`, so leaving it off saves battery on persistent chrome (tab/nav bars).
   * No-op on iOS, where the OS renders the glass specular.
   * @default false
   */
  tilt?: boolean;

  /**
   * Corner radius of the glass surface, in dp/points.
   *
   * Ignored when {@link shape} is set (the shape defines the silhouette).
   * @default 0
   */
  borderRadius?: number;

  /**
   * Custom silhouette for the glass — a circle, squircle, polygon, an explicit
   * set of points, or an arbitrary (even concave) SVG path. Omit for the default
   * rounded rectangle, which keeps the crispest native glass edges.
   *
   * The shape is stretched to fill the view's bounds, so size the view to the
   * shape's aspect ratio to avoid distortion. On Android the silhouette is
   * rendered via a signed-distance field (API 33+); below that it degrades to a
   * path-clipped frost. On iOS the glass is masked to the path.
   *
   * @example
   * <LiquidGlassView shape={{ type: 'circle' }} style={{ width: 96, height: 96 }} />
   * <LiquidGlassView shape={{ type: 'polygon', sides: 6 }} />
   * <LiquidGlassView shape={{ type: 'path', d: notchPath, width: W, height: H }} />
   */
  shape?: LiquidGlassShape;

  /**
   * Android only: a second glass body, smooth-min merged with {@link shape} so
   * the two cling and fuse as they approach — the mercury effect.
   *
   * Both shapes are stretched onto the same view bounds, so two bounds-filling
   * primitives (a circle and a hexagon, say) merge concentrically. To place two
   * separate bodies, author both as `path` or `points` shapes sharing one
   * view-box and position them within it — that is what produces the
   * two-blobs-touching look.
   *
   * The merge happens on the distance field, before normals are derived, so the
   * neck between the bodies is real glass with correct lensing rather than two
   * overlapping silhouettes.
   *
   * Works on **both platforms**, by different means: Android merges the signed
   * distance fields natively, which is cheaper and higher quality; iOS has no
   * field to blend (its silhouette is a `CAShapeLayer` mask), so the merged
   * outline is computed in JS and handed over as one ordinary path.
   *
   * **Set this once — do not animate it.** Changing either shape rebuilds the
   * distance field on the CPU, measured at ~361ms for a 340x190dp body on a
   * mid-range device. Animating the merge drove a test screen to 1.6fps. The
   * field bake is what buys the correct lensing through the neck; it is simply
   * not a per-frame operation.
   */
  secondaryShape?: LiquidGlassShape;

  /**
   * Android only: blend radius between {@link shape} and
   * {@link secondaryShape}, in dp.
   *
   * `0` is a hard union with a visible crease. Larger values pull a wider,
   * softer neck and bridge from further apart.
   *
   * The bridge forms when the two surfaces are each within roughly `k / 4` of
   * the midpoint between them — `smin(d, d, k) = d - k/4` — so to fuse bodies
   * that sit `g` apart you need `shapeSmoothing` above about `2 * g`. For
   * shapes ~100dp across, `16`–`48` covers the usual range.
   *
   * @default 0
   */
  shapeSmoothing?: number;

  /**
   * Android only (API 33+). Dials the edge-refraction lens strength up (~1.35×).
   * Lensing is intrinsic to the glass material and is never fully off — set
   * `thickness={0}` for a genuinely flat pane. No effect on iOS, where
   * refraction is rendered by the OS.
   * @default true
   */
  refraction?: boolean;

  /**
   * "Liquid volume" — how thick / deep the liquid glass reads, by scaling the
   * refraction and lensing depth.
   *
   * - `0` — a flat glass pane (blur + tint, no lensing)
   * - `1` — the default liquid glass look
   * - up to `~2` — a deep, heavily-refracting lens
   *
   * iOS fixes the `UIGlassEffect` optics, so intermediate values are Android
   * only — but `0` is honoured on both: with `rim` and `specular` off it is the
   * signal to drop Liquid Glass for a plain blur material.
   * @default 1
   */
  thickness?: number;

  /**
   * Android only: strength of the edge-reflection band — the upside-down "echo"
   * mirrored back at the top/bottom rim — from `0` (off) to `1` (default).
   *
   * Independent of {@link thickness}, so you can keep a deep lens while calming
   * the reflection over text-heavy backdrops, where the mirrored copy otherwise
   * reads as noise. No-op on iOS.
   * @default 1
   */
  edgeReflectionStrength?: number;

  /**
   * Android only: a `0`–`1` legibility veil drawn *under* the foreground
   * children so chrome (icons, labels) stays readable over `clear` glass,
   * without darkening the whole pane. The veil adapts to the backdrop
   * brightness (more veil over bright content) and is hued by {@link tintColor}
   * when set. `0` disables it. No-op on iOS.
   * @default 0
   */
  legibilityFloor?: number;

  /**
   * Android only: how often, in ms, to report frame timings via
   * {@link onFrameStats}. `0` (the default) disables it completely — nothing is
   * timed, accumulated or dispatched.
   *
   * This is a **development HUD**. Ship it off: the reporting itself is cheap,
   * but timing every frame is not free, and nothing in a released app should be
   * reading it.
   *
   * @default 0
   */
  frameStatsInterval?: number;

  /**
   * Android only: rainbow shimmer at the rim, `0`–`1`.
   *
   * The hue is driven by the angle to the centre and rides the same edge ramp
   * as the lens, so it reads as light splitting through the rim rather than a
   * colour overlay. Subtle values do the most work — `0.3` is already visible.
   * @default 0
   */
  iridescence?: number;

  /**
   * Android only: film grain over the surface, `0`–`~0.15`.
   *
   * Breaks up the flatness of a heavily blurred backdrop, which is what makes a
   * frosted material read as etched glass rather than a gradient. Above ~0.15
   * it stops looking like glass and starts looking like noise.
   * @default 0
   */
  grain?: number;

  /**
   * Android only: rotates the built-in light direction, in **radians**.
   *
   * An offset rather than an absolute bearing, so `0` keeps the default
   * top-left key light and existing layouts are unchanged. Drives the sheen
   * band, the specular hotspot and the inner shadow together, so the surface
   * stays internally consistent.
   * @default 0
   */
  lightAngle?: number;

  /**
   * Android only: multiplier on the specular exponent.
   *
   * `1` is the default hotspot. Higher is tighter and harder — polished glass;
   * lower is broader and softer — satin. Useful range roughly `0.25`–`4`.
   * @default 1
   */
  specularSharpness?: number;

  /**
   * Android only: multiplier on the backdrop vibrancy, applied **before** the
   * tint so it grades what the glass transmits rather than the tint itself.
   *
   * `1` is the default over-saturation glass already applies. `0` gives a
   * greyscale backdrop. Useful range roughly `0`–`2`.
   * @default 1
   */
  saturation?: number;

  /**
   * Android only: multiplier on backdrop luminance, applied **before** the tint.
   *
   * `1` is unchanged. Distinct from {@link dim}, which is a flat scrim over the
   * top: this grades the transmitted content, so the glass edge and sheen keep
   * their own brightness. Useful range roughly `0.5`–`1.5`.
   * @default 1
   */
  brightness?: number;

  /**
   * Android only: magnification of the backdrop through the centre of the lens.
   *
   * `1` (the default) samples the backdrop 1:1 — what a flat pane does. Above 1
   * the glass reads as a convex lens and enlarges what is behind it; below 1 it
   * reads as concave and shrinks it.
   *
   * Distinct from the touch magnifier that {@link interactive} adds, which is
   * transient and follows the finger. This one is a constant property of the
   * surface. Useful range roughly `0.5`–`2`.
   * @default 1
   */
  magnification?: number;

  /**
   * Android only: index of refraction — how sharply light bends entering the
   * glass.
   *
   * `1.5` is window glass, and is the default because it reproduces the tuned
   * look exactly. `1.0` is vacuum: no bending at all, so the lens flattens.
   * Above 1.5 the edges bend harder — `2.4` is roughly diamond.
   *
   * Related to {@link thickness} but not the same: `thickness` is how deep the
   * body of glass is, `ior` is what the material is made of. Useful range
   * roughly `1`–`2.5`.
   * @default 1.5
   */
  ior?: number;

  /**
   * Android only: how strongly the bright rim follows the light.
   *
   * `0` (the default) is the even outline iOS draws around every element.
   * Above `0` the rim is weighted by how squarely each edge faces the light —
   * or faces directly away from it — raised to this power, so a pill glints
   * top-left and bottom-right and goes quiet along its sides, the way a real
   * bevel catches a key light. `1` is a soft glint, `2`–`3` a sharp one. Moves
   * with {@link lightAngle} and {@link tilt}. Useful range roughly `0`–`4`.
   * @default 0
   */
  rimFalloff?: number;

  /**
   * Android only: chromatic dispersion at the rim, `0`–`1`.
   *
   * The material always splits red from blue by a hair where the lens bends
   * hardest; this scales that up to a deliberate spectral fringe, sampled at
   * seven wavelengths so it grades through orange, yellow and cyan rather than
   * reading as a red/blue ghost. `0.3` is a subtle prism edge; `1` is a
   * showpiece. Costs four extra backdrop taps per pixel while above `0`.
   * @default 0
   */
  dispersion?: number;

  /**
   * Android only: suspend the effect without unmounting. The glass holds its
   * last frame, and resuming re-captures immediately.
   *
   * The glass captures what is behind it once per frame, which is the single
   * most expensive thing it does. Set this whenever a view is mounted but not
   * being looked at and the library cannot tell on its own — a screen kept
   * alive in a navigator's stack, a carousel page off to the side.
   *
   * Views that Android itself reports as off-screen — behind a pushed screen,
   * on an inactive tab, or in a backgrounded app — pause automatically, so this
   * prop is for the cases that signal cannot see.
   *
   * No-op on iOS, where the OS owns the material's refresh.
   * @default false
   */
  paused?: boolean;

  /**
   * Fired once per view, after the first frame, reporting the tier that
   * actually rendered.
   *
   * Fires on every platform — including the web fallback, with `tier: 'none'` —
   * so a gate written as "render nothing until the tier arrives" resolves
   * everywhere rather than hanging.
   *
   * To decide whether to mount a glass view *at all*, use
   * `getGlassCapabilities()` instead: it answers before anything has committed.
   */
  onPipelineReady?: (event: NativeSyntheticEvent<GlassPipelineInfo>) => void;

  /**
   * Fired when the view cannot do what the props asked for — a shader that
   * would not compile, an unparseable `shape`, a backdrop capture that failed.
   *
   * Each code is reported at most once per view. Most are non-fatal: the view
   * recovered, but it is not rendering what you asked for. Everything is also
   * logged natively, so a handler is optional.
   */
  onError?: (event: NativeSyntheticEvent<GlassErrorInfo>) => void;

  /**
   * Android only: frame timings, aggregated over each {@link frameStatsInterval}
   * window. Never fires while that is `0`.
   *
   * Frames inside a window are averaged rather than sampled, and the worst one
   * is carried separately as `maxTotalMs` — read that when hunting jank.
   */
  onFrameStats?: (event: NativeSyntheticEvent<GlassFrameStats>) => void;
}
