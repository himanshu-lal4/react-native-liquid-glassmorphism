/** Cross-platform smooth-min outline used for the iOS side of #49. */
import { flattenPath, mergePathOutline } from '../mergePaths';

const rect = (x: number, y: number, w: number, h: number) =>
  `M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`;

describe('flattenPath', () => {
  it('flattens a closed rectangle to a polyline', () => {
    const polys = flattenPath(rect(0, 0, 10, 10));
    expect(polys).toHaveLength(1);
    expect(polys[0]?.length ?? 0).toBeGreaterThanOrEqual(4);
  });

  it('handles relative commands and H/V', () => {
    const polys = flattenPath('M 0 0 h 10 v 10 h -10 Z');
    expect(polys).toHaveLength(1);
    const xs = (polys[0] ?? []).map((pt) => pt[0]);
    expect(Math.max(...xs)).toBeCloseTo(10);
  });

  it('subdivides cubic and quadratic curves', () => {
    const cubic = flattenPath('M 0 0 C 5 0 10 5 10 10 Z');
    const quad = flattenPath('M 0 0 Q 10 0 10 10 Z');
    expect(cubic[0]?.length ?? 0).toBeGreaterThan(8);
    expect(quad[0]?.length ?? 0).toBeGreaterThan(8);
  });

  it('bails on an elliptic arc rather than emitting a wrong outline', () => {
    // A is unsupported by the native parsers too — refusing keeps the two in
    // step instead of iOS silently drawing a different silhouette.
    expect(flattenPath('M 0 0 A 5 5 0 0 1 10 10 Z')).toEqual([]);
  });
});

describe('mergePathOutline', () => {
  it('fuses two nearby rectangles into one closed loop', () => {
    // Gap is 20. Smooth-min bridges the midpoint when each surface is within
    // roughly k/4 of it (smin(d, d, k) = d - k/4), so k must exceed ~40 here —
    // 22 correctly leaves them separate, which the next case covers.
    const out = mergePathOutline(rect(10, 30, 40, 40), rect(70, 30, 40, 40), 120, 100, 56);
    expect(out).toBeTruthy();
    expect(out?.match(/M /g)).toHaveLength(1);
  });

  it('leaves them separate when smoothing is too small to bridge the gap', () => {
    const out = mergePathOutline(rect(10, 30, 40, 40), rect(70, 30, 40, 40), 120, 100, 22);
    expect(out?.match(/M /g)?.length ?? 0).toBeGreaterThanOrEqual(2);
  });

  it('leaves two far-apart bodies as separate loops', () => {
    const out = mergePathOutline(rect(0, 40, 20, 20), rect(100, 40, 20, 20), 120, 100, 4);
    expect(out).toBeTruthy();
    expect(out?.match(/M /g)?.length ?? 0).toBeGreaterThanOrEqual(2);
  });

  it('returns null when a path cannot be flattened', () => {
    expect(mergePathOutline('M 0 0 A 5 5 0 0 1 10 10 Z', rect(0, 0, 5, 5), 50, 50, 4)).toBeNull();
  });

  it('returns null for a degenerate view-box', () => {
    expect(mergePathOutline(rect(0, 0, 5, 5), rect(6, 0, 5, 5), 0, 0, 4)).toBeNull();
  });
});
