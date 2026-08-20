import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LiquidGlassView } from 'react-native-liquid-glassmorphism';

// ─────────────────────────────────────────────────────────────────────────────
// GLASS TAB BAR — the single most requested glass use case: a detached,
// fully-rounded tab bar floating above scrolling content, built from
// `<LiquidGlassView preset="floatingTabBar">`. Mirrors what
// docs/react-native-glass-tab-bar.md describes, so the documented recipe is
// exercised on real devices whenever anyone runs the demo. (Issue #88.)
//
// Opened from the API gallery ("▬ Tab bar" chip); the header's back arrow
// returns.
// ─────────────────────────────────────────────────────────────────────────────

const GRADIENT = ['#0f2027', '#2c5364', '#f5af19', '#f12711'] as const;

const TABS = [
  { key: 'home', icon: '⌂', label: 'Home' },
  { key: 'search', icon: '⌕', label: 'Search' },
  { key: 'library', icon: '♫', label: 'Library' },
  { key: 'profile', icon: '◍', label: 'You' },
] as const;

// Filler rows so there is real content scrolling underneath the bar — the
// preset's refraction is only legible with something moving behind it.
const ROWS = Array.from({ length: 24 }, (_, i) => ({
  title: `Track ${i + 1}`,
  subtitle: 'Artist — Album',
}));

export default function GlassTabBar({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState<(typeof TABS)[number]['key']>('home');

  return (
    <View style={styles.fill}>
      <LinearGradient
        colors={GRADIENT}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          // Leave room so the last row can scroll clear of the floating bar.
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 120 },
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={onBack} hitSlop={12}>
            <LiquidGlassView variant="clear" borderRadius={16} style={styles.backChip}>
              <Text style={styles.backChipText}>‹ Back</Text>
            </LiquidGlassView>
          </Pressable>
          <Text style={styles.heading}>Glass tab bar</Text>
        </View>

        {ROWS.map((row) => (
          <View key={row.title} style={styles.row}>
            <View style={styles.rowArt} />
            <View>
              <Text style={styles.rowTitle}>{row.title}</Text>
              <Text style={styles.rowSubtitle}>{row.subtitle}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* The floating bar itself: one LiquidGlassView, the documented preset,
          detached from the screen edge so the rim reads all the way around. */}
      <LiquidGlassView
        preset="floatingTabBar"
        style={[styles.tabBar, { bottom: Math.max(insets.bottom, 16) + 8 }]}
      >
        <View style={styles.tabRow}>
          {TABS.map((tab) => {
            const isActive = tab.key === active;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActive(tab.key)}
                style={styles.tab}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={tab.label}
              >
                <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>{tab.icon}</Text>
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </LiquidGlassView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  backChip: { paddingHorizontal: 14, paddingVertical: 8 },
  backChipText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  heading: { color: '#fff', fontSize: 22, fontWeight: '700' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  rowArt: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  rowTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  rowSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },

  tabBar: {
    position: 'absolute',
    left: 24,
    right: 24,
    height: 64,
  },
  tabRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tab: { alignItems: 'center', minWidth: 56, paddingVertical: 6 },
  tabIcon: { fontSize: 20, color: 'rgba(255,255,255,0.75)' },
  tabIconActive: { color: '#fff' },
  tabLabel: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  tabLabelActive: { color: '#fff', fontWeight: '600' },
});
