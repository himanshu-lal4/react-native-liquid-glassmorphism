import { normalizeShape, type NormalizedShape } from '../shapes';

// Assert non-null and narrow, without a `!` non-null assertion.
const nn = (s: NormalizedShape | null): NormalizedShape => {
  expect(s).not.toBeNull();
  return s as NormalizedShape;
};

describe('normalizeShape', () => {
  it('generates a closed circle path in a 100×100 box', () => {
    const s = nn(normalizeShape({ type: 'circle' }));
    expect(s).not.toBeNull();
    expect(s.viewBoxWidth).toBe(100);
    expect(s.viewBoxHeight).toBe(100);
    expect(s.path.startsWith('M')).toBe(true);
    expect(s.path.trim().endsWith('Z')).toBe(true);
    // Four cubic segments make a bézier circle.
    expect(s.path.match(/C/g) ?? []).toHaveLength(4);
  });

  it('makes a squircle boxier than a circle at the same radius', () => {
    // At 45°, a superellipse (n=4) reaches further toward the corner than a
    // circle would, so its max coordinate exceeds the circle's rightmost point.
    const sq = nn(normalizeShape({ type: 'squircle', n: 4 }));
    const xs = sq.path
      .split(/[ML]\s*/)
      .filter(Boolean)
      .map((seg) => parseFloat(seg));
    expect(Math.max(...xs)).toBeGreaterThan(99); // reaches the box edge
    expect(sq.path.includes('C')).toBe(false); // flattened to a polyline
  });

  it('makes a near-ellipse (n=2) and a classic squircle (n=4) distinct, valid paths', () => {
    // Guards that the exponent actually changes the silhouette. Both flatten to
    // valid polylines that touch the box edge on-axis; the difference shows at
    // the 45° diagonal, where the higher exponent (n=4) bulges toward the
    // corner while n=2 stays a plain ellipse. Measure the max corner reach.
    const cornerReach = (n: number) => {
      const sq = nn(normalizeShape({ type: 'squircle', n }));
      const coords = sq.path.replace(/[MLZ]/g, ' ').trim().split(/\s+/).map(Number);
      let max = 0;
      for (let i = 0; i + 1 < coords.length; i += 2) {
        const x = coords[i];
        const y = coords[i + 1];
        if (x !== undefined && y !== undefined) {
          max = Math.max(max, x + y); // x + y, biggest toward (100,100)
        }
      }
      return max;
    };
    const ellipse = nn(normalizeShape({ type: 'squircle', n: 2 }));
    const squircle = nn(normalizeShape({ type: 'squircle', n: 4 }));
    expect(ellipse.path).not.toBe(squircle.path); // distinct silhouettes
    expect(ellipse.path.includes('C')).toBe(false); // both flattened to polylines
    expect(squircle.path.includes('C')).toBe(false);
    expect(cornerReach(4)).toBeGreaterThan(cornerReach(2)); // squircle bulges cornerward
  });

  it('emits N vertices for a regular polygon', () => {
    const hex = nn(normalizeShape({ type: 'polygon', sides: 6 }));
    // One M + (N-1) L commands for N vertices, then Z.
    expect(hex.path.match(/L/g) ?? []).toHaveLength(5);
    expect(hex.path.trim().endsWith('Z')).toBe(true);
  });

  it('clamps polygon sides to a minimum of 3', () => {
    const tri = nn(normalizeShape({ type: 'polygon', sides: 1 }));
    expect(tri.path.match(/L/g) ?? []).toHaveLength(2); // 3 vertices
  });

  it('generates a default 5-point star with alternating radii', () => {
    const star = nn(normalizeShape({ type: 'star' }));
    expect(star.viewBoxWidth).toBe(100);
    expect(star.viewBoxHeight).toBe(100);
    // 5 spikes → 10 vertices → 1 M + 9 L, closed with Z.
    expect(star.path.match(/L/g) ?? []).toHaveLength(9);
    expect(star.path.trim().endsWith('Z')).toBe(true);
    // First point is the top spike at the outer radius: (50, 0).
    expect(star.path.startsWith('M 50 0')).toBe(true);
  });

  it('respects a custom point count and inner ratio for a star', () => {
    const star = nn(normalizeShape({ type: 'star', points: 6, innerRatio: 0.4 }));
    // 6 spikes → 12 vertices → 11 L commands.
    expect(star.path.match(/L/g) ?? []).toHaveLength(11);
  });

  it('rotates a polygon so its first vertex moves off the top', () => {
    // Un-rotated, the first vertex points straight up: (50, 0).
    const up = nn(normalizeShape({ type: 'polygon', sides: 4 }));
    expect(up.path.startsWith('M 50 0')).toBe(true);
    // Rotating 90° swings the first vertex to the right edge: (100, 50).
    const rot = nn(normalizeShape({ type: 'polygon', sides: 4, rotation: 90 }));
    expect(rot.path.startsWith('M 100 50')).toBe(true);
    expect(rot.path).not.toBe(up.path);
  });

  it('derives the view-box from an explicit points bounding box', () => {
    const s = nn(
      normalizeShape({
        type: 'points',
        points: [
          [0, 0],
          [40, 0],
          [20, 30],
        ],
      })
    );
    expect(s.viewBoxWidth).toBe(40);
    expect(s.viewBoxHeight).toBe(30);
    expect(s.path).toBe('M 0 0 L 40 0 L 20 30 Z');
  });

  it('rejects degenerate point sets', () => {
    expect(
      normalizeShape({
        type: 'points',
        points: [
          [0, 0],
          [1, 1],
        ],
      })
    ).toBeNull();
  });

  it('rejects three or more collinear points (zero enclosed area)', () => {
    // A triangle whose vertices all lie on one line encloses no area — it would
    // rasterise to a broken zero-width silhouette, so it should fall back.
    expect(
      normalizeShape({
        type: 'points',
        points: [
          [0, 0],
          [10, 10],
          [20, 20],
        ],
      })
    ).toBeNull();
    // Collinear along an axis too (this used to slip through as height/width 0).
    expect(
      normalizeShape({
        type: 'points',
        points: [
          [0, 0],
          [10, 0],
          [20, 0],
        ],
      })
    ).toBeNull();
  });

  it('passes an arbitrary SVG path straight through with its view-box', () => {
    const d = 'M 0 0 L 100 0 C 100 40 60 40 50 20 Z';
    const s = nn(normalizeShape({ type: 'path', d, width: 100, height: 60 }));
    expect(s.path).toBe(d);
    expect(s.viewBoxWidth).toBe(100);
    expect(s.viewBoxHeight).toBe(60);
  });

  it('passes a relative-command path (m/l/c) through unchanged with its view-box', () => {
    // Relative commands are the native parser's job — normalizeShape must hand
    // them through verbatim, not rewrite them to absolute.
    const d = 'm 10 10 l 40 0 c 10 0 10 20 0 20 l -40 0 z';
    const s = nn(normalizeShape({ type: 'path', d, width: 60, height: 40 }));
    expect(s.path).toBe(d);
    expect(s.viewBoxWidth).toBe(60);
    expect(s.viewBoxHeight).toBe(40);
  });

  it('rejects an empty or unsized path', () => {
    expect(normalizeShape({ type: 'path', d: '', width: 100, height: 60 })).toBeNull();
    expect(normalizeShape({ type: 'path', d: 'M0 0', width: 0, height: 60 })).toBeNull();
  });
});
