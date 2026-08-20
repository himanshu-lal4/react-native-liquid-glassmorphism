import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  LiquidGlassContainer,
  LiquidGlassView,
  ScrollEdgeBlurView,
} from 'react-native-liquid-glassmorphism';

/**
 * Deliberately abusive. Every case here is something a real app does that the
 * unit tests cannot reach, and that this library has crashed or misbehaved on
 * at least once during development.
 *
 * - rapid mount/unmount, which is where SharedBackdrop refcounting and the
 *   container's child-suppression either balance or leak
 * - MORE glass children than a container can merge, which must degrade to
 *   unmerged glass rather than to invisible views
 * - glass inside a virtualised list, where views are recycled aggressively
 * - a container mounting and unmounting under live children
 */
export default function StressTest({ onBack }: { onBack: () => void }) {
  const [churn, setChurn] = useState(true);
  const [tick, setTick] = useState(0);
  const [container, setContainer] = useState(true);

  // Mount/unmount a whole subtree twice a second.
  useEffect(() => {
    if (!churn) return;
    const id = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(id);
  }, [churn]);

  const showA = tick % 2 === 0;

  return (
    <View style={styles.root}>
      <ScrollEdgeBlurView edge="top" maxBlurRadius={30} style={styles.edge} />

      <Text style={styles.title}>Stress</Text>
      <Text style={styles.sub}>churn {churn ? 'on' : 'off'} · tick {tick}</Text>

      {/* 12 children in a container that merges at most 8 — the rest must
          still render, as ordinary unmerged glass. */}
      {container ? (
        <LiquidGlassContainer spacing={30} style={styles.row}>
          {Array.from({ length: 12 }, (_, i) => (
            <LiquidGlassView
              key={i}
              variant="clear"
              borderRadius={14}
              style={styles.chip}
            />
          ))}
        </LiquidGlassContainer>
      ) : (
        <View style={styles.row} />
      )}

      {/* Churning subtree: mounted and unmounted twice a second. */}
      <View style={styles.row}>
        {showA
          ? Array.from({ length: 6 }, (_, i) => (
              <LiquidGlassView key={`a${i}`} borderRadius={12} style={styles.chip} />
            ))
          : null}
      </View>

      {/* Glass in a virtualised list — recycling. */}
      <FlatList
        style={styles.list}
        data={Array.from({ length: 40 }, (_, i) => i)}
        keyExtractor={(i) => String(i)}
        renderItem={({ item }) => (
          <LiquidGlassView
            variant={item % 2 ? 'clear' : 'regular'}
            borderRadius={16}
            style={styles.card}
          >
            <Text style={styles.cardText}>row {item}</Text>
          </LiquidGlassView>
        )}
      />

      <View style={styles.controls}>
        <Pressable onPress={() => setChurn((c) => !c)}>
          <LiquidGlassView borderRadius={14} style={styles.btn}>
            <Text style={styles.btnText}>churn</Text>
          </LiquidGlassView>
        </Pressable>
        <Pressable onPress={() => setContainer((c) => !c)}>
          <LiquidGlassView borderRadius={14} style={styles.btn}>
            <Text style={styles.btnText}>container</Text>
          </LiquidGlassView>
        </Pressable>
        <Pressable onPress={onBack}>
          <LiquidGlassView borderRadius={14} style={styles.btn}>
            <Text style={styles.btnText}>← back</Text>
          </LiquidGlassView>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: 70, paddingHorizontal: 12 },
  edge: { position: 'absolute', top: 0, left: 0, right: 0, height: 110 },
  title: { color: '#fff', fontSize: 24, fontWeight: '800' },
  sub: { color: 'rgba(255,255,255,0.7)', marginBottom: 10 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, minHeight: 56, marginBottom: 8 },
  chip: { width: 52, height: 44, overflow: 'hidden' },
  list: { flex: 1 },
  card: { height: 60, marginBottom: 8, justifyContent: 'center', paddingHorizontal: 14, overflow: 'hidden' },
  cardText: { color: '#fff', fontWeight: '600' },
  controls: { flexDirection: 'row', gap: 10, paddingVertical: 12 },
  btn: { paddingHorizontal: 16, paddingVertical: 10, overflow: 'hidden' },
  btnText: { color: '#fff', fontWeight: '700' },
});
