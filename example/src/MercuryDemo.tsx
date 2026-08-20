import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  LiquidGlassView,
  ScrollEdgeBlurView,
} from 'react-native-liquid-glassmorphism';

const W = 320;
const H = 190;
const R = 52;
const MIN_GAP = 34;
const MAX_GAP = 126;

/**
 * A circle as cubic béziers.
 *
 * The `shape` parser has no elliptic-arc support on purpose, and both bodies
 * have to share one view-box for the merge to mean anything — so they are
 * authored as paths positioned inside a common 320x190 box rather than as two
 * `{ type: 'circle' }` shapes, which would each fill the view and sit
 * concentrically.
 */
function circle(cx: number, cy: number, r: number) {
  const k = 0.5522847498307936 * r;
  return (
    `M ${cx - r} ${cy} ` +
    `C ${cx - r} ${cy - k} ${cx - k} ${cy - r} ${cx} ${cy - r} ` +
    `C ${cx + k} ${cy - r} ${cx + r} ${cy - k} ${cx + r} ${cy} ` +
    `C ${cx + r} ${cy + k} ${cx + k} ${cy + r} ${cx} ${cy + r} ` +
    `C ${cx - k} ${cy + r} ${cx - r} ${cy + k} ${cx - r} ${cy} Z`
  );
}

/**
 * Discrete steps rather than an animation loop, on purpose.
 *
 * `secondaryShape` merges on the signed-distance FIELD, which is baked on the
 * CPU whenever the silhouette changes — measured at ~361ms on a Realme
 * RMX3868. That is the right trade for a fixed shape and completely the wrong
 * one per frame: animating the gap drove this screen to 1.6fps.
 *
 * Stepping between presets costs one rebuild per tap, which reads as a beat
 * rather than as jank. An analytic merge that can animate is tracked
 * separately.
 */
const STEPS: Array<{ label: string; gap: number }> = [
  { label: 'Apart', gap: MAX_GAP },
  { label: 'Touching', gap: 74 },
  { label: 'Merged', gap: MIN_GAP },
];

export default function MercuryDemo({ onBack }: { onBack: () => void }) {
  const [gap, setGap] = useState(MAX_GAP);

  return (
    <View style={styles.root}>
      {/*
        Doubles as the <ScrollEdgeBlurView> demo: a header-style blur pinned to
        the top edge, dissolving into the crisp backdrop below. It takes no
        children and is pointerEvents:none, so it sits over the scene without
        touching it.
      */}
      <ScrollEdgeBlurView
        edge="top"
        maxBlurRadius={40}
        falloff={0.9}
        style={styles.edgeBlur}
      />
      <Text style={styles.title}>Smooth-min merge</Text>
      <Text style={styles.sub}>
        {`secondaryShape · shapeSmoothing={64} · gap ${gap}`}
      </Text>

      <View style={{ width: W, height: H }}>
        <LiquidGlassView
          variant="clear"
          thickness={1.4}
          blurRadius={10}
          shape={{
            type: 'path',
            d: circle(W / 2 - gap / 2, H / 2, R),
            width: W,
            height: H,
          }}
          secondaryShape={{
            type: 'path',
            d: circle(W / 2 + gap / 2, H / 2, R),
            width: W,
            height: H,
          }}
          shapeSmoothing={64}
          style={StyleSheet.absoluteFill}
        />

        {/*
          The two bodies are one view here, not two — the merge happens on the
          silhouette, so there is a single set of children. Labels are therefore
          positioned over each body's centre rather than being its children.
        */}
        <Text style={[styles.badge, { left: W / 2 - gap / 2 - 8, top: H / 2 - 14 }]}>1</Text>
        <Text style={[styles.badge, { left: W / 2 + gap / 2 - 8, top: H / 2 - 14 }]}>2</Text>
      </View>

      <View style={styles.steps}>
        {STEPS.map((s2) => (
          <Pressable key={s2.label} onPress={() => setGap(s2.gap)}>
            <LiquidGlassView
              tintColor={
                gap === s2.gap ? 'rgba(10,132,255,0.45)' : 'rgba(255,255,255,0.18)'
              }
              borderRadius={14}
              style={styles.stepChip}
            >
              <Text style={styles.chipText}>{s2.label}</Text>
            </LiquidGlassView>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={onBack} style={styles.back}>
        <LiquidGlassView tintColor="rgba(255,255,255,0.18)" borderRadius={16} style={styles.chip}>
          <Text style={styles.chipText}>← Back</Text>
        </LiquidGlassView>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  title: { color: '#fff', fontSize: 26, fontWeight: '800' },
  sub: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginBottom: 6 },
  steps: { flexDirection: 'row', gap: 10, marginTop: 16 },
  stepChip: { paddingHorizontal: 16, paddingVertical: 9, overflow: 'hidden' },
  back: { marginTop: 14 },
  chip: { paddingHorizontal: 18, paddingVertical: 10, overflow: 'hidden' },
  chipText: { color: '#fff', fontWeight: '700' },
  edgeBlur: { position: 'absolute', top: 0, left: 0, right: 0, height: 220 },
  badge: {
    position: 'absolute',
    color: 'rgba(255,255,255,0.9)',
    fontSize: 22,
    fontWeight: '700',
  },
});
