import { codegenNativeComponent, type ColorValue, type ViewProps } from 'react-native';
import type {
  DirectEventHandler,
  Float,
  Int32,
  WithDefault,
} from 'react-native/Libraries/Types/CodegenTypes';

/**
 * Payload of `onPipelineReady` — which rendering path this view actually got.
 *
 * `tier` is a string rather than a union because codegen event payloads cannot
 * carry one; the JS wrapper narrows it back to `GlassTier`.
 */
export type PipelineReadyEvent = Readonly<{
  tier: string;
  osVersion: Int32;
  shaderCompiled: boolean;
  supportsNativeGlass: boolean;
}>;

/** Payload of `onError` — see `GlassErrorCode` in `types.ts` for the codes. */
export type GlassErrorEvent = Readonly<{
  code: string;
  message: string;
  fatal: boolean;
}>;

/**
 * Codegen spec for the native Liquid Glass Fabric component.
 *
 * This is the low-level contract between JS and native. App code should use the
 * `<LiquidGlassView>` wrapper from the package root, not this component directly.
 */
export interface NativeProps extends ViewProps {
  /**
   * Glass material style.
   * - `regular`: adaptive frosted glass (iOS 26 `.regular` / blurred material).
   * - `clear`: lighter, more transparent glass for media-rich backgrounds.
   */
  variant?: WithDefault<'regular' | 'clear', 'regular'>;

  /** Tint applied over the blurred backdrop. */
  tintColor?: ColorValue;

  /** Blur / material strength, 0–100. Ignored on iOS 26 native glass (OS-managed). */
  intensity?: WithDefault<Int32, 60>;

  /**
   * Android only: explicit blur radius in dp, overriding the value `intensity`
   * would derive. Negative (the default) means "derive it from `intensity`" —
   * codegen floats cannot be null, so a sentinel carries "unset".
   */
  blurRadius?: WithDefault<Float, -1>;

  /** iOS 26 interactive glass + Android touch-reactive specular highlight. */
  interactive?: boolean;

  /**
   * Android only: draw the bright glass edge. `false` leaves a plain blurred
   * pane with no outline — the building block for a BlurView-style surface.
   */
  rim?: WithDefault<boolean, true>;

  /**
   * Android only: draw the moving sheen and specular hotspot. `false` removes
   * every light-driven highlight, leaving a flat material.
   */
  specular?: WithDefault<boolean, true>;

  /**
   * A flat dimming scrim over the backdrop, `0`–`1`, under the children.
   * The modal/backdrop primitive. Unlike `legibilityFloor` it is constant, not
   * adaptive. Implemented on both platforms.
   */
  dim?: WithDefault<Float, 0>;

  /**
   * Android only: device-tilt specular (gyro/accelerometer). Decoupled from
   * `interactive` so touch response can run without an always-on motion sensor.
   * The sensor is registered only while this is `true`.
   */
  tilt?: boolean;

  /** Corner radius of the glass surface, in dp/points. */
  glassCornerRadius?: WithDefault<Int32, 0>;

  /**
   * Custom silhouette as an SVG path string, authored in the view-box given by
   * `shapeViewBoxWidth`/`Height` and stretched to fill the view. Empty string
   * (the default) means "use the rounded rectangle from `glassCornerRadius`".
   */
  shapePath?: WithDefault<string, ''>;

  /** Width of the coordinate space `shapePath` is authored in. `0` = no shape. */
  shapeViewBoxWidth?: WithDefault<Float, 0>;

  /** Height of the coordinate space `shapePath` is authored in. `0` = no shape. */
  shapeViewBoxHeight?: WithDefault<Float, 0>;

  /**
   * Android only (API 33+): dials the edge-refraction lens strength up (~1.35×).
   * Lensing is intrinsic to the glass and never fully off — use `thickness={0}`
   * for a flat pane. No-op on iOS, where the OS renders refraction natively.
   */
  refraction?: boolean;

  /**
   * Android only: "liquid volume" — scales the refraction/lens depth of the
   * glass. 0 = flat pane (no lensing), 1 = default, up to ~2 = deep liquid lens.
   * No-op on iOS, where the OS fixes the glass optics.
   */
  thickness?: WithDefault<Float, 1.0>;

  /**
   * Android only: strength of the edge-reflection band (the upside-down rim
   * echo), 0–1, independent of `thickness`. Lower it over text-heavy backdrops
   * where the mirrored copy reads as noise. No-op on iOS.
   */
  edgeReflectionStrength?: WithDefault<Float, 1.0>;

  /**
   * Android only: 0–1 legibility veil drawn UNDER the foreground children so
   * chrome (icons/labels) stays readable over `clear` glass. Adapts to the
   * backdrop brightness. 0 = off. No-op on iOS.
   */
  legibilityFloor?: WithDefault<Float, 0>;

  /**
   * Fired once per view, after the first frame, with the tier that actually
   * rendered. Not a device capability check — an explicit prop or an OS-level
   * fallback can hold a capable device to a lower tier.
   */
  onPipelineReady?: DirectEventHandler<PipelineReadyEvent>;

  /**
   * Fired when the view cannot do what the props asked for: a shader that would
   * not compile, an unparseable shape, a backdrop capture that failed. Each
   * code is reported at most once per view, so a per-frame failure cannot spam
   * the bridge.
   */
  onError?: DirectEventHandler<GlassErrorEvent>;
}

export default codegenNativeComponent<NativeProps>('LiquidGlassmorphismView');
