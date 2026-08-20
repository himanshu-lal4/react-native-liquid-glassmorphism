/**
 * Smooth-min merge of two silhouettes, in JavaScript.
 *
 * Android merges two glass bodies on the signed-distance FIELD, which is both
 * cheaper and higher quality — see `GlassSdf`. iOS has no field to blend: the
 * silhouette is a `CAShapeLayer` mask, so it needs an actual merged outline.
 *
 * Rather than write the whole thing twice in Kotlin and Objective-C++, the
 * outline is computed here and handed to iOS as one ordinary `path` shape. The
 * result is that `secondaryShape` behaves the same on both platforms, with each
 * getting the representation it can actually use.
 *
 * Everything here runs once per shape change, never per frame.
 */

/** Subdivisions per bézier segment when flattening to a polyline. */
const BEZIER_STEPS = 16;

/** Grid resolution the merged field is sampled at before contouring. */
const GRID = 112;

type Pt = readonly [number, number];

/**
 * Parse an SVG path into flattened polylines, one per subpath.
 *
 * Supports the same command set as the native parsers — M/L/H/V/C/S/Q/T/Z,
 * absolute and relative — and deliberately not elliptic arcs, so a path that
 * works on Android works here and vice versa.
 */
export function flattenPath(d: string): Pt[][] {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi);
  if (!tokens) return [];

  const subpaths: Pt[][] = [];
  let cur: Pt[] = [];
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  // Reflection state for the S/T shorthands.
  let lastC: Pt | null = null;
  let lastQ: Pt | null = null;
  let cmd = '';
  let i = 0;

  const num = () => Number(tokens[i++]);
  const push = (px: number, py: number) => cur.push([px, py] as Pt);
  const endSub = () => {
    if (cur.length > 1) subpaths.push(cur);
    cur = [];
  };

  const cubic = (x1: number, y1: number, x2: number, y2: number, ex: number, ey: number) => {
    const x0 = x;
    const y0 = y;
    for (let s = 1; s <= BEZIER_STEPS; s++) {
      const t = s / BEZIER_STEPS;
      const u = 1 - t;
      push(
        u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * ex,
        u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * ey
      );
    }
    lastC = [x2, y2];
    lastQ = null;
    x = ex;
    y = ey;
  };

  const quad = (x1: number, y1: number, ex: number, ey: number) => {
    const x0 = x;
    const y0 = y;
    for (let s = 1; s <= BEZIER_STEPS; s++) {
      const t = s / BEZIER_STEPS;
      const u = 1 - t;
      push(u * u * x0 + 2 * u * t * x1 + t * t * ex, u * u * y0 + 2 * u * t * y1 + t * t * ey);
    }
    lastQ = [x1, y1];
    lastC = null;
    x = ex;
    y = ey;
  };

  while (i < tokens.length) {
    const tok = tokens[i]!;
    if (/[a-zA-Z]/.test(tok)) {
      cmd = tok;
      i++;
      if (cmd === 'Z' || cmd === 'z') {
        if (cur.length) push(startX, startY);
        endSub();
        x = startX;
        y = startY;
        continue;
      }
    }
    const rel = cmd === cmd.toLowerCase();
    const c = cmd.toUpperCase();

    if (c === 'M') {
      endSub();
      const nx = num();
      const ny = num();
      x = rel ? x + nx : nx;
      y = rel ? y + ny : ny;
      startX = x;
      startY = y;
      push(x, y);
      // A second coordinate pair after M is an implicit lineto.
      cmd = rel ? 'l' : 'L';
    } else if (c === 'L') {
      const nx = num();
      const ny = num();
      x = rel ? x + nx : nx;
      y = rel ? y + ny : ny;
      push(x, y);
    } else if (c === 'H') {
      const nx = num();
      x = rel ? x + nx : nx;
      push(x, y);
    } else if (c === 'V') {
      const ny = num();
      y = rel ? y + ny : ny;
      push(x, y);
    } else if (c === 'C') {
      const x1 = rel ? x + num() : num();
      const y1 = rel ? y + num() : num();
      const x2 = rel ? x + num() : num();
      const y2 = rel ? y + num() : num();
      const ex = rel ? x + num() : num();
      const ey = rel ? y + num() : num();
      cubic(x1, y1, x2, y2, ex, ey);
    } else if (c === 'S') {
      const rx = lastC ? 2 * x - lastC[0] : x;
      const ry = lastC ? 2 * y - lastC[1] : y;
      const x2 = rel ? x + num() : num();
      const y2 = rel ? y + num() : num();
      const ex = rel ? x + num() : num();
      const ey = rel ? y + num() : num();
      cubic(rx, ry, x2, y2, ex, ey);
    } else if (c === 'Q') {
      const x1 = rel ? x + num() : num();
      const y1 = rel ? y + num() : num();
      const ex = rel ? x + num() : num();
      const ey = rel ? y + num() : num();
      quad(x1, y1, ex, ey);
    } else if (c === 'T') {
      const rx = lastQ ? 2 * x - lastQ[0] : x;
      const ry = lastQ ? 2 * y - lastQ[1] : y;
      const ex = rel ? x + num() : num();
      const ey = rel ? y + num() : num();
      quad(rx, ry, ex, ey);
    } else {
      // Unknown command (an elliptic arc, most likely). Bail rather than
      // silently emit a wrong outline — the caller falls back to no merge.
      return [];
    }
  }
  endSub();
  return subpaths;
}

/** Signed distance to a set of closed polylines. Negative inside. */
function signedDistance(polys: Pt[][], px: number, py: number): number {
  let best = Infinity;
  let inside = false;
  for (const poly of polys) {
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [ax, ay] = poly[i]!;
      const [bx, by] = poly[j]!;
      // Even-odd crossing test.
      if (ay > py !== by > py && px < ((bx - ax) * (py - ay)) / (by - ay) + ax) {
        inside = !inside;
      }
      const dx = bx - ax;
      const dy = by - ay;
      const len2 = dx * dx + dy * dy;
      const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
      const cx = ax + t * dx;
      const cy = ay + t * dy;
      const d = Math.hypot(px - cx, py - cy);
      if (d < best) best = d;
    }
  }
  return inside ? -best : best;
}

/** IQ's polynomial smooth minimum. Matches `GlassSdf.smin` exactly. */
function smin(a: number, b: number, k: number): number {
  const h = Math.max(0, Math.min(1, 0.5 + (0.5 * (b - a)) / k));
  return b * (1 - h) + a * h - k * h * (1 - h);
}

/**
 * Merge two path silhouettes into one outline.
 *
 * @param k blend radius, in the same units as the view-box.
 * @returns an SVG path, or `null` if either path could not be flattened — the
 *   caller should fall back to the primary shape alone rather than draw
 *   something wrong.
 */
export function mergePathOutline(
  dA: string,
  dB: string,
  viewBoxWidth: number,
  viewBoxHeight: number,
  k: number
): string | null {
  const a = flattenPath(dA);
  const b = flattenPath(dB);
  if (!a.length || !b.length) return null;
  if (viewBoxWidth <= 0 || viewBoxHeight <= 0) return null;

  const gw = GRID;
  const gh = Math.max(8, Math.round((GRID * viewBoxHeight) / viewBoxWidth));
  const sx = viewBoxWidth / (gw - 1);
  const sy = viewBoxHeight / (gh - 1);
  const kk = Math.max(1e-4, k);

  const field = new Float32Array(gw * gh);
  for (let gy = 0; gy < gh; gy++) {
    for (let gx = 0; gx < gw; gx++) {
      const px = gx * sx;
      const py = gy * sy;
      field[gy * gw + gx] = smin(signedDistance(a, px, py), signedDistance(b, px, py), kk);
    }
  }

  // Marching squares on the zero iso-line, emitting one line segment per cell.
  // Segments are stitched into loops afterwards; a merged blob is a single
  // closed contour, but two bodies still far apart produce two.
  const segs: Array<[Pt, Pt]> = [];
  const lerp = (p1: Pt, v1: number, p2: Pt, v2: number): Pt => {
    const t = v1 === v2 ? 0.5 : v1 / (v1 - v2);
    return [p1[0] + (p2[0] - p1[0]) * t, p1[1] + (p2[1] - p1[1]) * t];
  };

  for (let gy = 0; gy < gh - 1; gy++) {
    for (let gx = 0; gx < gw - 1; gx++) {
      const i0 = gy * gw + gx;
      const v = [field[i0]!, field[i0 + 1]!, field[i0 + gw + 1]!, field[i0 + gw]!];
      const p: Pt[] = [
        [gx * sx, gy * sy],
        [(gx + 1) * sx, gy * sy],
        [(gx + 1) * sx, (gy + 1) * sy],
        [gx * sx, (gy + 1) * sy],
      ];
      let mask = 0;
      for (let n = 0; n < 4; n++) if (v[n]! < 0) mask |= 1 << n;
      if (mask === 0 || mask === 15) continue;

      const edge = (n: number): Pt => lerp(p[n]!, v[n]!, p[(n + 1) % 4]!, v[(n + 1) % 4]!);
      const crossings: Pt[] = [];
      for (let n = 0; n < 4; n++) {
        if (v[n]! < 0 !== v[(n + 1) % 4]! < 0) crossings.push(edge(n));
      }
      // 2 crossings is the ordinary case; 4 is a saddle, where joining them
      // pairwise in order is good enough at this grid density.
      for (let n = 0; n + 1 < crossings.length; n += 2) {
        segs.push([crossings[n]!, crossings[n + 1]!]);
      }
    }
  }
  if (!segs.length) return null;

  // Stitch segments into closed loops by nearest endpoint.
  const eps = Math.min(sx, sy) * 0.5;
  const used = new Array(segs.length).fill(false);
  const key = (pt: Pt) => `${Math.round(pt[0] / eps)},${Math.round(pt[1] / eps)}`;
  const byStart = new Map<string, number[]>();
  segs.forEach((sg, idx) => {
    for (const pt of sg) {
      const kk2 = key(pt);
      if (!byStart.has(kk2)) byStart.set(kk2, []);
      byStart.get(kk2)!.push(idx);
    }
  });

  const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));
  const parts: string[] = [];

  for (let s = 0; s < segs.length; s++) {
    if (used[s]) continue;
    used[s] = true;
    const loop: Pt[] = [segs[s]![0], segs[s]![1]];
    let guard = 0;
    while (guard++ < segs.length * 2) {
      const tail = loop[loop.length - 1]!;
      const cands = byStart.get(key(tail)) ?? [];
      let next = -1;
      for (const c of cands) {
        if (!used[c]) {
          next = c;
          break;
        }
      }
      if (next < 0) break;
      used[next] = true;
      const [p0, p1] = segs[next]!;
      loop.push(key(p0) === key(tail) ? p1 : p0);
    }
    if (loop.length < 3) continue;
    parts.push(
      `M ${fmt(loop[0]![0])} ${fmt(loop[0]![1])} ${loop
        .slice(1)
        .map((pt) => `L ${fmt(pt[0])} ${fmt(pt[1])}`)
        .join(' ')} Z`
    );
  }

  return parts.length ? parts.join(' ') : null;
}
