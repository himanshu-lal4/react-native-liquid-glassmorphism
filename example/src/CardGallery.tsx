import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  LiquidGlassView,
  type LiquidGlassShape,
} from 'react-native-liquid-glassmorphism';

// ─────────────────────────────────────────────────────────────────────────────
// CARD GALLERY — a scrollable board of `<LiquidGlassView>` cards over a colorful
// gradient, laid out so the props read side-by-side. Doubles as copy-paste
// documentation: each card's caption names the exact prop it demonstrates.
//
// Opened from the API gallery ("▦ Cards" chip); the header's back arrow returns.
// ─────────────────────────────────────────────────────────────────────────────

// A vivid diagonal wash behind the cards — straight gradient bands are the
// clearest backdrop for reading refraction (the glass visibly bends them).
const GRADIENT = ['#ff5f6d', '#ffc371', '#3ca55c', '#5b86e5', '#833ab4'] as const;

const TINTS = [
  { c: 'rgba(10,132,255,0.45)', label: 'Blue' },
  { c: 'rgba(255,55,95,0.42)', label: 'Pink' },
  { c: 'rgba(48,209,88,0.42)', label: 'Green' },
  { c: 'rgba(255,214,10,0.42)', label: 'Amber' },
] as const;

const SHAPES: Array<{ label: string; shape: LiquidGlassShape }> = [
  { label: 'circle', shape: { type: 'circle' } },
  { label: 'squircle', shape: { type: 'squircle', n: 4 } },
  { label: 'hexagon', shape: { type: 'polygon', sides: 6 } },
];

export default function CardGallery({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const [interactive, setInteractive] = useState(true);

  return (
    <View style={styles.fill}>
      <LinearGradient colors={GRADIENT} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 48 },
        ]}
      >
        {/* Header with a glass back button */}
        <View style={styles.headerRow}>
          <Pressable onPress={onBack} hitSlop={12}>
            <LiquidGlassView variant="clear" borderRadius={16} style={styles.backChip}>
              <Text style={styles.backChipText}>‹ Back</Text>
            </LiquidGlassView>
          </Pressable>
          <Text style={styles.heading}>Card Gallery</Text>
        </View>

        {/* 1. Variant comparison: regular (frosted) vs clear (media) --------- */}
        <Caption>variant — frosted vs clear</Caption>
        <View style={styles.row2}>
          <LiquidGlassView variant="regular" borderRadius={22} style={styles.halfCard}>
            <Text style={styles.cardTitle}>Regular</Text>
            <Text style={styles.cardBody}>Adaptive frosted glass</Text>
            <Code>variant="regular"</Code>
          </LiquidGlassView>
          <LiquidGlassView variant="clear" borderRadius={22} style={styles.halfCard}>
            <Text style={styles.cardTitle}>Clear</Text>
            <Text style={styles.cardBody}>Lighter, for media</Text>
            <Code>variant="clear"</Code>
          </LiquidGlassView>
        </View>

        {/* 2. Tinted cards -------------------------------------------------- */}
        <Caption>tintColor — rgba() controls strength</Caption>
        <View style={styles.rowWrap}>
          {TINTS.map((t) => (
            <LiquidGlassView
              key={t.label}
              tintColor={t.c}
              borderRadius={20}
              style={styles.tintCard}
            >
              <Text style={styles.tintLabel}>{t.label}</Text>
            </LiquidGlassView>
          ))}
        </View>

        {/* 3. Interactive card (touch bloom + tilt specular) --------------- */}
        <Caption>interactive — touch bloom &amp; tilt specular</Caption>
        <LiquidGlassView
          variant="regular"
          interactive={interactive}
          borderRadius={22}
          style={styles.wideCard}
        >
          <View style={styles.wideCardRow}>
            <View style={styles.wideCardText}>
              <Text style={styles.cardTitle}>Press &amp; tilt me</Text>
              <Code>interactive={interactive ? '{true}' : '{false}'}</Code>
            </View>
            <Switch value={interactive} onValueChange={setInteractive} />
          </View>
        </LiquidGlassView>

        {/* 4. Shape cards: circle / squircle / polygon -------------------- */}
        <Caption>shape — a real optical silhouette, not a clip</Caption>
        <View style={styles.rowWrap}>
          {SHAPES.map((s) => (
            <View key={s.label} style={styles.shapeCol}>
              <LiquidGlassView
                variant="clear"
                interactive
                shape={s.shape}
                style={styles.shapeGlass}
              />
              <Code>{`{ type: '${s.label === 'hexagon' ? 'polygon' : s.label}' }`}</Code>
            </View>
          ))}
        </View>

        {/* 5. Hero card — everything at once ------------------------------ */}
        <Caption>a full glass hero card</Caption>
        <LiquidGlassView variant="regular" borderRadius={26} style={styles.heroCard}>
          <Text style={styles.heroTitle}>Liquid Glass</Text>
          <Text style={styles.cardBody}>
            Real refraction on iOS and Android — from one declarative component.
          </Text>
          <View style={styles.heroButtons}>
            <LiquidGlassView
              tintColor="rgba(10,132,255,0.55)"
              interactive
              borderRadius={16}
              style={styles.heroButton}
            >
              <Text style={styles.heroButtonText}>Get started</Text>
            </LiquidGlassView>
            <LiquidGlassView interactive borderRadius={16} style={styles.heroButton}>
              <Text style={styles.heroButtonText}>Docs</Text>
            </LiquidGlassView>
          </View>
        </LiquidGlassView>
      </ScrollView>
    </View>
  );
}

function Caption({ children }: { children: React.ReactNode }) {
  return <Text style={styles.caption}>{children}</Text>;
}

// Monospace prop echo under each card, so the gallery reads as documentation.
function Code({ children }: { children: React.ReactNode }) {
  return <Text style={styles.code}>{children}</Text>;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: 18, gap: 8 },

  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 8 },
  backChip: { paddingHorizontal: 14, paddingVertical: 9, overflow: 'hidden' },
  backChipText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  heading: { fontSize: 28, fontWeight: '800', color: '#fff' },

  caption: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 20,
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  row2: { flexDirection: 'row', gap: 14 },
  halfCard: { flex: 1, padding: 16, gap: 6, minHeight: 118, overflow: 'hidden' },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  cardBody: { fontSize: 13, color: 'rgba(255,255,255,0.92)', lineHeight: 18 },
  code: {
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.9)',
    fontFamily: 'monospace',
    marginTop: 6,
  },

  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center' },
  tintCard: {
    flexGrow: 1,
    minWidth: 150,
    paddingVertical: 20,
    alignItems: 'center',
    overflow: 'hidden',
  },
  tintLabel: { color: '#fff', fontSize: 15, fontWeight: '700' },

  wideCard: { padding: 18, overflow: 'hidden' },
  wideCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wideCardText: { gap: 2 },

  shapeCol: { alignItems: 'center', gap: 8, width: 96 },
  shapeGlass: { width: 88, height: 88 },

  heroCard: { padding: 22, gap: 12, overflow: 'hidden' },
  heroTitle: { fontSize: 26, fontWeight: '800', color: '#fff' },
  heroButtons: { flexDirection: 'row', gap: 12, marginTop: 4 },
  heroButton: { paddingHorizontal: 20, paddingVertical: 12, overflow: 'hidden' },
  heroButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
