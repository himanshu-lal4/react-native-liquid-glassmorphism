import { useState } from 'react';
import {
  Dimensions,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { verticalScale } from 'react-native-size-matters';
import { LiquidGlassView } from 'react-native-liquid-glassmorphism';

// Full PHYSICAL screen size (includes the system status/navigation bars).
// React Native applies the bottom system inset as padding on the root view, so
// a plain `StyleSheet.absoluteFill` (bottom:0) stops at the padding edge and
// leaves a strip of root background showing above the nav bar. Sizing the
// backdrop to the whole screen makes it draw edge-to-edge under the bars.
const SCREEN = Dimensions.get('screen');

// Apple fanned-blades wallpaper: rich light/dark tonal variation so glass blur,
// edge refraction and the regular/clear difference all read clearly. Stretched
// to fill the whole device so the entire landscape image is always visible.
function Backdrop() {
  return (
    <Image
      source={require('../assets/wallpaper.png')}
      style={styles.backdrop}
      resizeMode="stretch"
    />
  );
}


/**
 * Liquid Glass gallery — exercises every facet of the public API:
 * variants (regular / clear), tint, interactivity, shapes (card / pill /
 * circle), an intensity ramp, glass buttons, and a floating glass tab bar.
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <Gallery />
    </SafeAreaProvider>
  );
}

function Gallery() {
  const [interactive, setInteractive] = useState(true);
  const [refraction, setRefraction] = useState(true);
  const insets = useSafeAreaInsets();

  // Bottom tab bar sits above the system bar. Android's gesture/nav bar needs a
  // touch more breathing room than iOS's home indicator.
  const dockBottom =
    Platform.OS === 'android' ? insets.bottom + verticalScale(4) : insets.bottom;

  return (
    <View style={styles.root}>
      <Backdrop />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Liquid Glass</Text>
        <Text style={styles.subheading}>iOS 26 UIGlassEffect · React Native</Text>

        {/* 1. Variants ------------------------------------------------------ */}
        <Text style={styles.section}>Variants</Text>
        <View style={styles.row2}>
          <LiquidGlassView variant="regular" borderRadius={24} style={styles.tile}>
            <Text style={styles.tileTitle}>Regular</Text>
            <Text style={styles.tileBody}>Adaptive frosted glass</Text>
          </LiquidGlassView>
          <LiquidGlassView variant="clear" borderRadius={24} style={styles.tile}>
            <Text style={styles.tileTitle}>Clear</Text>
            <Text style={styles.tileBody}>Lighter, for media</Text>
          </LiquidGlassView>
        </View>

        {/* 2. Tints --------------------------------------------------------- */}
        <Text style={styles.section}>Tinted glass</Text>
        <View style={styles.rowWrap}>
          {[
            { c: 'rgba(255,255,255,0.18)', label: 'White' },
            { c: 'rgba(10,132,255,0.45)', label: 'Blue' },
            { c: 'rgba(255,55,95,0.40)', label: 'Pink' },
            { c: 'rgba(48,209,88,0.40)', label: 'Green' },
            { c: 'rgba(0,0,0,0.30)', label: 'Smoke' },
          ].map((t) => (
            <LiquidGlassView
              key={t.label}
              tintColor={t.c}
              borderRadius={18}
              style={styles.chip}
            >
              <Text style={styles.chipText}>{t.label}</Text>
            </LiquidGlassView>
          ))}
        </View>

        {/* 3. Interactive --------------------------------------------------- */}
        <Text style={styles.section}>Interactive</Text>
        <LiquidGlassView
          variant="regular"
          interactive={interactive}
          borderRadius={22}
          style={styles.rowCard}
        >
          <Text style={styles.tileBody}>Reacts to touch (iOS 26)</Text>
          <Switch value={interactive} onValueChange={setInteractive} />
        </LiquidGlassView>
        <LiquidGlassView borderRadius={22} style={styles.rowCard}>
          <Text style={styles.tileBody}>Refraction (Android shader)</Text>
          <Switch value={refraction} onValueChange={setRefraction} />
        </LiquidGlassView>

        {/* 4. Shapes -------------------------------------------------------- */}
        <Text style={styles.section}>Shapes</Text>
        <View style={styles.rowWrap}>
          <LiquidGlassView borderRadius={40} interactive style={styles.pill}>
            <Text style={styles.tileTitle}>Pill</Text>
          </LiquidGlassView>
          <LiquidGlassView borderRadius={44} interactive style={styles.circle}>
            <Text style={styles.circleGlyph}>+</Text>
          </LiquidGlassView>
          <LiquidGlassView
            variant="clear"
            borderRadius={16}
            style={styles.square}
          >
            <Text style={styles.tileTitle}>Card</Text>
          </LiquidGlassView>
        </View>

        {/* 5. Intensity ramp (pre-26 fallback) ------------------------------ */}
        <Text style={styles.section}>Intensity (fallback)</Text>
        <View style={styles.rowWrap}>
          {[20, 50, 80, 100].map((i) => (
            <LiquidGlassView
              key={i}
              intensity={i}
              borderRadius={16}
              style={styles.chip}
            >
              <Text style={styles.chipText}>{i}</Text>
            </LiquidGlassView>
          ))}
        </View>

        {/* 6. Glass buttons ------------------------------------------------- */}
        <Text style={styles.section}>Buttons</Text>
        <View style={styles.rowWrap}>
          <Pressable>
            <LiquidGlassView
              tintColor="rgba(10,132,255,0.55)"
              interactive
              borderRadius={26}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Get Started</Text>
            </LiquidGlassView>
          </Pressable>
          <Pressable>
            <LiquidGlassView interactive borderRadius={26} style={styles.button}>
              <Text style={styles.buttonText}>Learn More</Text>
            </LiquidGlassView>
          </Pressable>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* 7. macOS-dock-style clear glass tray ----------------------------- */}
      <View
        style={[styles.dockWrap, { bottom: dockBottom }]}
        pointerEvents="box-none"
      >
        <LiquidGlassView
          variant="clear"
          interactive
          borderRadius={28}
          style={styles.dock}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1b1f3a' },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN.width,
    height: SCREEN.height,
  },
  content: { padding: 20, paddingTop: 72, gap: 8 },
  heading: { fontSize: 36, fontWeight: '800', color: '#fff' },
  subheading: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 8 },
  section: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.65)',
    marginTop: 18,
    marginBottom: 4,
  },

  row2: { flexDirection: 'row', gap: 14 },
  tile: { flex: 1, padding: 18, overflow: 'hidden', minHeight: 96 },
  tileTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  tileBody: { fontSize: 14, color: 'rgba(255,255,255,0.92)', marginTop: 4 },

  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center' },
  chip: { paddingHorizontal: 18, paddingVertical: 12, overflow: 'hidden' },
  chipText: { color: '#fff', fontWeight: '600' },

  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    overflow: 'hidden',
    marginTop: 8,
  },

  pill: { paddingHorizontal: 28, paddingVertical: 18, overflow: 'hidden' },
  circle: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  circleGlyph: { fontSize: 34, color: '#fff' },
  square: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  button: {
    paddingHorizontal: 26,
    paddingVertical: 16,
    overflow: 'hidden',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // macOS dock: centered, content-hugging clear-glass tray.
  dockWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  dock: {
    width: 320,
    height: 64,
    overflow: 'hidden',
  },
});
