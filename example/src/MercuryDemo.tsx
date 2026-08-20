import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LiquidGlassView } from 'react-native-liquid-glassmorphism';

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

export default function MercuryDemo({ onBack }: { onBack: () => void }) {
  const [gap, setGap] = useState(MAX_GAP);
  const dir = useRef(-1);

  useEffect(() => {
    const id = setInterval(() => {
      setGap((g) => {
        if (g <= MIN_GAP) dir.current = 1;
        if (g >= MAX_GAP) dir.current = -1;
        return g + dir.current * 4;
      });
    }, 90);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Smooth-min merge</Text>
      <Text style={styles.sub}>
        {`secondaryShape · shapeSmoothing={64} · gap ${gap}`}
      </Text>

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
        style={{ width: W, height: H }}
      />

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
  back: { marginTop: 18 },
  chip: { paddingHorizontal: 18, paddingVertical: 10, overflow: 'hidden' },
  chipText: { color: '#fff', fontWeight: '700' },
});
