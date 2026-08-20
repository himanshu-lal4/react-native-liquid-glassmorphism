import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  LiquidGlassContainer,
  LiquidGlassView,
} from 'react-native-liquid-glassmorphism';

const W = 400;
const H = 190;
const D = 116;
const MIN_GAP = 4;
const MAX_GAP = 250;

/**
 * Two glass bodies that drift together and fuse — the container version.
 *
 * Nothing here changes a `shape`, which is the point. The bodies are ordinary
 * glass views and only their POSITION animates; the container smooth-mins them
 * per pixel in the shader on Android, and hands them to
 * `UIGlassContainerEffect` on iOS. Either way a frame costs a uniform upload
 * rather than a distance-field rebuild, so this runs at frame rate where the
 * `secondaryShape` version managed about 1.6fps.
 */
export default function MergingOrbs({ top }: { top: number }) {
  const [gap, setGap] = useState(MAX_GAP);
  const dir = useRef(-1);

  useEffect(() => {
    const id = setInterval(() => {
      setGap((g) => {
        if (g <= MIN_GAP) dir.current = 1;
        if (g >= MAX_GAP) dir.current = -1;
        return g + dir.current * 5;
      });
    }, 16);
    return () => clearInterval(id);
  }, []);

  const left = W / 2 - gap / 2 - D / 2;
  const right = W / 2 + gap / 2 - D / 2;
  const y = (H - D) / 2;

  return (
    <View pointerEvents="none" style={[styles.wrap, { top }]}>
      <LiquidGlassContainer spacing={54} style={{ width: W, height: H }}>
        <LiquidGlassView
          variant="clear"
          blurRadius={0}
          thickness={1.4}
          borderRadius={D / 2}
          style={[styles.orb, { left, top: y }]}
        />
        <LiquidGlassView
          variant="clear"
          blurRadius={0}
          thickness={1.4}
          borderRadius={D / 2}
          style={[styles.orb, { left: right, top: y }]}
        />
      </LiquidGlassContainer>
      <Text style={[styles.badge, { left: left + D / 2 - 6, top: top ? y + D / 2 - 14 : 0 }]}>
        1
      </Text>
      <Text style={[styles.badge, { left: right + D / 2 - 6, top: y + D / 2 - 14 }]}>2</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  orb: { position: 'absolute', width: D, height: D },
  badge: {
    position: 'absolute',
    color: 'rgba(255,255,255,0.92)',
    fontSize: 22,
    fontWeight: '700',
  },
});
