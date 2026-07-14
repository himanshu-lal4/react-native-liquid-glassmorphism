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

  it('passes an arbitrary SVG path straight through with its view-box', () => {
    const d = 'M 0 0 L 100 0 C 100 40 60 40 50 20 Z';
    const s = nn(normalizeShape({ type: 'path', d, width: 100, height: 60 }));
    expect(s.path).toBe(d);
    expect(s.viewBoxWidth).toBe(100);
    expect(s.viewBoxHeight).toBe(60);
  });

  it('rejects an empty or unsized path', () => {
    expect(normalizeShape({ type: 'path', d: '', width: 100, height: 60 })).toBeNull();
    expect(normalizeShape({ type: 'path', d: 'M0 0', width: 0, height: 60 })).toBeNull();
  });
});
