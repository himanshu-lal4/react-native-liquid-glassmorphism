/**
 * Custom-shape support for `<LiquidGlassView>`.
 *
 * Every shape a user can ask for is normalised, here in JS, down to a single
 * **SVG path string plus the view-box it was authored in**. Native then does
 * exactly one thing: parse that path and stretch it to fill the view's bounds
 * (`preserveAspectRatio="none"` — size the view to the shape's aspect ratio if
 * you want it undistorted). This keeps all the shape math testable in JS and the
 * native contract tiny and identical across iOS and Android.
 *
 * The glass effects (edge lensing, rim, dispersion, medial-axis seam-fade) are
 * all derived from a signed-distance function on native, so any silhouette —
 * circle, polygon, or an arbitrary concave SVG path — gets the full treatment.
 */

/**
 * A custom glass silhouette. Omit `shape` entirely to get the default
 * rounded-rectangle (driven by `borderRadius`), which keeps the crispest native
 * glass edges.
 */
export type LiquidGlassShape =
  | {
      /** A circle inscribed in the view's (square) bounds. */
      type: 'circle';
    }
  | {
      /**
       * A superellipse / squircle (iOS-style continuous curvature).
       * @param n Exponent — 2 is an ellipse, 4 the classic squircle, higher is
       * boxier. @default 4
       */
      type: 'squircle';
      n?: number;
    }
  | {
      /**
       * A regular N-sided polygon (triangle, hexagon, …) inscribed in the bounds.
       */
      type: 'polygon';
      /** Number of sides, >= 3. */
      sides: number;
      /** Rotation in degrees. 0 points the first vertex straight up. @default 0 */
      rotation?: number;
      /** Optional corner rounding, 0–1 as a fraction of the radius. @default 0 */
      cornerRadius?: number;
    }
  | {
      /**
       * A star / spiked polygon inscribed in the bounds, first point straight up.
       */
      type: 'star';
      /** Number of points (spikes), >= 2. @default 5 */
      points?: number;
      /** Inner/outer radius ratio, 0–1 — smaller is spikier. @default 0.5 */
      innerRatio?: number;
    }
  | {
      /**
       * An arbitrary polygon from explicit points. Coordinates may be in any
       * space — the bounding box becomes the view-box, so `[0..1]` normalised or
       * raw pixel points both work.
       */
      type: 'points';
      points: Array<readonly [number, number]>;
    }
  | {
      /**
       * A raw SVG path. Supports M/L/H/V/C/S/Q/T/Z (absolute + relative). Elliptic
       * arcs (`A`) are not supported — express curves as cubic/quadratic béziers.
       * Concave shapes (e.g. a tab-bar notch) are fully supported.
       */
      type: 'path';
      /** SVG path `d` string. */
      d: string;
      /** Width of the coordinate space `d` is authored in. */
      width: number;
      /** Height of the coordinate space `d` is authored in. */
      height: number;
    };

/** The native-facing normal form: a path string and the box it lives in. */
export interface NormalizedShape {
  path: string;
  viewBoxWidth: number;
  viewBoxHeight: number;
}

// Bézier circle constant: control-point offset for a quarter-circle arc.
const KAPPA = 0.5522847498307936;

const fmt = (n: number): string =>
  // Trim to 3 decimals and drop trailing zeros so paths stay compact/stable.
  (Math.round(n * 1000) / 1000).toString();

/** Circle of radius `r` centred at (cx, cy) as four cubic béziers. */
function circlePath(cx: number, cy: number, r: number): string {
  const o = r * KAPPA;
  return [
    `M ${fmt(cx)} ${fmt(cy - r)}`,
    `C ${fmt(cx + o)} ${fmt(cy - r)} ${fmt(cx + r)} ${fmt(cy - o)} ${fmt(cx + r)} ${fmt(cy)}`,
    `C ${fmt(cx + r)} ${fmt(cy + o)} ${fmt(cx + o)} ${fmt(cy + r)} ${fmt(cx)} ${fmt(cy + r)}`,
    `C ${fmt(cx - o)} ${fmt(cy + r)} ${fmt(cx - r)} ${fmt(cy + o)} ${fmt(cx - r)} ${fmt(cy)}`,
    `C ${fmt(cx - r)} ${fmt(cy - o)} ${fmt(cx - o)} ${fmt(cy - r)} ${fmt(cx)} ${fmt(cy - r)}`,
    'Z',
  ].join(' ');
}

/** A closed polyline through `pts` as `M … L … Z`. */
function polylinePath(pts: Array<readonly [number, number]>): string {
  if (pts.length === 0) return '';
  const cmds = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${fmt(p[0])} ${fmt(p[1])}`);
  return `${cmds.join(' ')} Z`;
}

// Sampling density for analytic curves that we flatten to a polyline (squircle).
// The native SDF re-smooths the silhouette, so a moderate count reads cleanly.
const SUPERELLIPSE_SAMPLES = 96;

const UNIT_BOX = { viewBoxWidth: 100, viewBoxHeight: 100 };

/** Superellipse (`|x|^n + |y|^n = 1`) inscribed in the 100×100 box. */
function squircleShape(n: number): NormalizedShape {
  const exp = n >= 2 ? n : 4;
  const pts: Array<readonly [number, number]> = [];
  for (let i = 0; i < SUPERELLIPSE_SAMPLES; i++) {
    const t = (i / SUPERELLIPSE_SAMPLES) * Math.PI * 2;
    const ct = Math.cos(t);
    const st = Math.sin(t);
    // sign(cos)·|cos|^(2/n), sign(sin)·|sin|^(2/n), centred at (50,50), r=50.
    const x = 50 + Math.sign(ct) * Math.pow(Math.abs(ct), 2 / exp) * 50;
    const y = 50 + Math.sign(st) * Math.pow(Math.abs(st), 2 / exp) * 50;
    pts.push([x, y]);
  }
  return { path: polylinePath(pts), ...UNIT_BOX };
}

/** Regular N-gon inscribed in the 100×100 box, first vertex up (before rotation). */
function polygonShape(sides: number, rotationDeg: number): NormalizedShape {
  const count = Math.max(3, Math.round(sides));
  const rot = (rotationDeg * Math.PI) / 180;
  const verts: Array<readonly [number, number]> = [];
  for (let i = 0; i < count; i++) {
    const a = -Math.PI / 2 + rot + (i / count) * Math.PI * 2;
    verts.push([50 + Math.cos(a) * 50, 50 + Math.sin(a) * 50]);
  }
  return { path: polylinePath(verts), ...UNIT_BOX };
}

/**
 * Star inscribed in the 100×100 box, first spike up. `points` outer vertices
 * alternate with `points` inner vertices at `innerRatio` of the radius.
 */
function starShape(points: number, innerRatio: number): NormalizedShape {
  const spikes = Math.max(2, Math.round(points));
  const inner = Math.min(1, Math.max(0, innerRatio)) * 50;
  const verts: Array<readonly [number, number]> = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? 50 : inner;
    const a = -Math.PI / 2 + (i / (spikes * 2)) * Math.PI * 2;
    verts.push([50 + Math.cos(a) * r, 50 + Math.sin(a) * r]);
  }
  return { path: polylinePath(verts), ...UNIT_BOX };
}

/** Arbitrary polygon; the points' bounding box (from 0,0) becomes the view-box. */
function pointsShape(points: Array<readonly [number, number]>): NormalizedShape | null {
  if (!points || points.length < 3) return null;
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  return {
    path: polylinePath(points),
    viewBoxWidth: Math.max(...xs) || 1,
    viewBoxHeight: Math.max(...ys) || 1,
  };
}

/**
 * Convert a public {@link LiquidGlassShape} into the native path/view-box form.
 * Returns `null` for shapes that should fall back to the rounded-rect path.
 */
export function normalizeShape(shape: LiquidGlassShape): NormalizedShape | null {
  switch (shape.type) {
    case 'circle':
      return { path: circlePath(50, 50, 50), ...UNIT_BOX };
    case 'squircle':
      return squircleShape(shape.n ?? 4);
    case 'polygon':
      return polygonShape(shape.sides, shape.rotation ?? 0);
    case 'star':
      return starShape(shape.points ?? 5, shape.innerRatio ?? 0.5);
    case 'points':
      return pointsShape(shape.points);
    case 'path':
      if (!shape.d || shape.width <= 0 || shape.height <= 0) return null;
      return {
        path: shape.d,
        viewBoxWidth: shape.width,
        viewBoxHeight: shape.height,
      };
    default:
      return null;
  }
}
