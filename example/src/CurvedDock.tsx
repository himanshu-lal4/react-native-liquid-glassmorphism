import { useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { LiquidGlassView } from 'react-native-liquid-glassmorphism';

// ─────────────────────────────────────────────────────────────
// CURVED TAB BAR SILHOUETTE
// The exact concave "notch dock" from a real app (Snoozewar), authored as an
// SVG path. This is the flagship custom-shape demo: a *concave* silhouette
// (impossible with borderRadius) rendered as true refractive liquid glass —
// the glass lenses the wallpaper around the center scoop, not just a blur.
// ─────────────────────────────────────────────────────────────

export const DOCK_W = Dimensions.get('window').width;
export const DOCK_H = 82;
export const FAB_SIZE = 64;

// Notch geometry: the scoop opening is ~0.83·FAB wide; the depth is kept
// shallower (~0.62·FAB) so the bar isn't taller than it needs to be to cradle
// the button, with control points at 0.11 / 0.25·FAB.
const NOTCH_WIDTH = Math.round(FAB_SIZE * 0.83);
const NOTCH_DEPTH = Math.round(FAB_SIZE * 0.62);

// Curved bar with a center dip that cradles the floating add button. Authored in
// a DOCK_W × DOCK_H view-box; the glass view is sized to match so it isn't
// distorted. Mirrors Snoozewar's bottom tab bar silhouette.
export function createDockPath(width: number = DOCK_W): string {
  const center = width / 2;
  const left = center - NOTCH_WIDTH / 2;
  const right = center + NOTCH_WIDTH / 2;
  const top = 0;
  const bottom = DOCK_H;
  const dip = top + NOTCH_DEPTH;
  const sh = Math.round(FAB_SIZE * 0.5); // shoulder
  const cp1 = Math.round(FAB_SIZE * 0.11); // inner control point
  const cp2 = Math.round(FAB_SIZE * 0.25); // outer control point

  return `
    M 0 ${top}
    L ${left - sh} ${top}
    C ${left - cp1} ${top}, ${left - cp2} ${dip}, ${center} ${dip}
    C ${right + cp2} ${dip}, ${right + cp1} ${top}, ${right + sh} ${top}
    L ${width} ${top}
    L ${width} ${bottom}
    L 0 ${bottom}
    Z
  `.trim();
}

const DOCK_PATH = createDockPath();

const DOCK_TABS = [
  { key: 'home', glyph: '⌂', label: 'Home' },
  { key: 'alarm', glyph: '◔', label: 'Alarm' },
  { key: 'track', glyph: '◈', label: 'Track' },
  // U+FE0E forces text presentation — bare U+2699 is tofu in SF on iOS.
  { key: 'settings', glyph: '⚙︎', label: 'Settings' },
] as const;

export function CurvedDock({ bottom }: { bottom: number }) {
  const [active, setActive] = useState('home');
  return (
    <View style={[styles.dockWrap, { bottom }]} pointerEvents="box-none">
      {/* Floating add button that sits in the notch — circle clear glass with a
          press-scale, like a real tab-bar FAB. */}
      <View style={styles.fabSlot} pointerEvents="box-none">
        <Pressable
          style={({ pressed }) => pressed && styles.fabPressed}
          onPress={() => setActive('add')}
        >
          <LiquidGlassView
            variant="clear"
            interactive
            tintColor="rgba(10,132,255,0.5)"
            shape={{ type: 'circle' }}
            style={styles.fab}
          >
            <Text style={styles.fabGlyph}>＋</Text>
          </LiquidGlassView>
        </Pressable>
      </View>

      {/* The curved-notch glass dock — a concave custom SVG shape. */}
      <LiquidGlassView
        variant="clear"
        interactive
        shape={{ type: 'path', d: DOCK_PATH, width: DOCK_W, height: DOCK_H }}
        style={styles.dock}
      >
        <View style={styles.dockRow} pointerEvents="box-none">
          {DOCK_TABS.slice(0, 2).map((t) => (
            <DockItem
              key={t.key}
              glyph={t.glyph}
              label={t.label}
              active={active === t.key}
              onPress={() => setActive(t.key)}
            />
          ))}
          <View style={{ width: FAB_SIZE + 20 }} />
          {DOCK_TABS.slice(2).map((t) => (
            <DockItem
              key={t.key}
              glyph={t.glyph}
              label={t.label}
              active={active === t.key}
              onPress={() => setActive(t.key)}
            />
          ))}
        </View>
      </LiquidGlassView>
    </View>
  );
}

function DockItem({
  glyph,
  label,
  active,
  onPress,
}: {
  glyph: string;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.dockItem, pressed && styles.dockItemPressed]}
      onPress={onPress}
    >
      <Text style={[styles.dockGlyph, active && styles.dockGlyphActive]}>
        {glyph}
      </Text>
      <Text style={[styles.dockLabel, active && styles.dockLabelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dockWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  dock: {
    width: DOCK_W,
    height: DOCK_H,
  },
  dockRow: {
    flexDirection: 'row',
    height: DOCK_H,
    // Side items sit on full-height glass, so center them in the bar rather
    // than pushing the whole row below the (center-only) scoop.
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  dockItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  dockItemPressed: { transform: [{ scale: 0.9 }], opacity: 0.7 },
  // Clear glass sits over a bright, shifting wallpaper, so the labels need a
  // drop shadow to stay readable on any backdrop (as a real iOS tab bar does).
  dockGlyph: {
    fontSize: 23,
    color: 'rgba(255,255,255,0.9)',
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  dockGlyphActive: { color: '#fff' },
  dockLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  dockLabelActive: { color: '#fff', fontWeight: '700' },

  // Floating add button, centered in the notch and overlapping the dock top.
  fabSlot: {
    position: 'absolute',
    top: -FAB_SIZE / 2 + 6,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabPressed: { transform: [{ scale: 0.92 }] },
  fabGlyph: { fontSize: 30, color: '#fff', fontWeight: '300' },
});
