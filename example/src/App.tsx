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
import {
  LiquidGlassView,
  type LiquidGlassShape,
} from 'react-native-liquid-glassmorphism';
import { CurvedDock, DOCK_H, createDockPath } from './CurvedDock';
import DemoReel from './DemoReel';
import CardGallery from './CardGallery';
import MercuryDemo from './MercuryDemo';

// Full PHYSICAL screen size (includes the system status/navigation bars).
// React Native applies the bottom system inset as padding on the root view, so
// a plain `StyleSheet.absoluteFill` (bottom:0) stops at the padding edge and
// leaves a strip of root background showing above the nav bar. Sizing the
// backdrop to the whole screen makes it draw edge-to-edge under the bars.
const SCREEN = Dimensions.get('screen');
const WINDOW_W = Dimensions.get('window').width;

// Warped neon-grid wallpaper: straight grid lines are the clearest possible
// backdrop for showing refraction — the glass visibly bends them, so blur, edge
// lensing and the regular/clear difference all read at a glance. Stretched to
// fill the whole device so the full image is always visible.
function Backdrop() {
  return (
    <Image
      source={require('../assets/wallpaper.png')}
      style={styles.backdrop}
      resizeMode="stretch"
    />
  );
}

// A little star, to prove arbitrary concave points work too.
const STAR_POINTS = starPoints(5, 50, 20);

// Heart and blob as cubic-bézier SVG paths (the shape engine takes any path —
// arcs excluded — so curves are expressed as C segments).
const HEART_SHAPE: LiquidGlassShape = {
  type: 'path',
  d: 'M 50 88 C 20 64 4 46 4 28 C 4 12 16 4 28 4 C 38 4 46 10 50 18 C 54 10 62 4 72 4 C 84 4 96 12 96 28 C 96 46 80 64 50 88 Z',
  width: 100,
  height: 100,
};
const BLOB_SHAPE: LiquidGlassShape = {
  type: 'path',
  d: 'M 50 6 C 72 2 92 18 94 40 C 96 62 84 88 60 92 C 36 96 10 84 6 60 C 2 36 20 12 50 6 Z',
  width: 100,
  height: 100,
};

// Bare-glass comparison strip: every silhouette as IDENTICAL simple clear
// glass — no tint, no children, no touch — so silhouettes compare directly.
const BARE_SHAPES: Array<{ label: string; shape: LiquidGlassShape }> = [
  { label: 'circle', shape: { type: 'circle' } },
  { label: 'squircle', shape: { type: 'squircle', n: 4 } },
  { label: 'hexagon', shape: { type: 'polygon', sides: 6 } },
  { label: 'triangle', shape: { type: 'polygon', sides: 3 } },
  { label: 'star', shape: { type: 'points', points: STAR_POINTS } },
  { label: 'heart', shape: HEART_SHAPE },
  { label: 'blob', shape: BLOB_SHAPE },
];

// Inline dock-path strip, sized to the scroll content width (screen − padding).
const BARE_DOCK_W = WINDOW_W - 40;
const BARE_DOCK_PATH = createDockPath(BARE_DOCK_W);

// Bare swatches: one per row at max size — a square filling the full content
// width (screen minus the 20px page padding each side).
const BARE_SIZE = WINDOW_W - 40;
// Side-by-side A/B cell: two of them plus the gap across the content width.
const AB_SIZE = Math.floor((WINDOW_W - 40 - 12) / 2);
// Three-up row for the composition primitives.
const PRIM_SIZE = Math.floor((WINDOW_W - 40 - 24) / 3);
function starPoints(
  spikes: number,
  outer: number,
  inner: number
): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  const cx = 50;
  const cy = 50;
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i / (spikes * 2)) * Math.PI * 2;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return pts;
}

/**
 * Boots into the self-playing demo reel (the README-GIF screen). Long-press
 * anywhere in the reel to drop into the API gallery; the gallery's "Demo"
 * chip goes back.
 */
export default function App() {
  const [mode, setMode] = useState<'reel' | 'gallery' | 'cards' | 'mercury'>(
    'reel'
  );
  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <Backdrop />
        {mode === 'reel' ? (
          <DemoReel onExit={() => setMode('gallery')} />
        ) : mode === 'cards' ? (
          <CardGallery onBack={() => setMode('gallery')} />
        ) : mode === 'mercury' ? (
          <MercuryDemo onBack={() => setMode('gallery')} />
        ) : (
          <Gallery
            onShowReel={() => setMode('reel')}
            onShowCards={() => setMode('cards')}
            onShowMercury={() => setMode('mercury')}
          />
        )}
      </View>
    </SafeAreaProvider>
  );
}

function Gallery({
  onShowReel,
  onShowCards,
  onShowMercury,
}: {
  onShowReel: () => void;
  onShowCards: () => void;
  onShowMercury: () => void;
}) {
  const [interactive, setInteractive] = useState(true);
  const [refraction, setRefraction] = useState(true);
  const insets = useSafeAreaInsets();

  // Bottom dock sits above the system bar. Android's gesture/nav bar needs a
  // touch more breathing room than iOS's home indicator.
  const dockBottom =
    Platform.OS === 'android' ? insets.bottom + verticalScale(4) : insets.bottom;

  return (
    <View style={styles.fill}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headingRow}>
          <Text style={styles.heading}>Liquid Glass</Text>
          <View style={styles.headingChips}>
            <Pressable onPress={onShowCards}>
              <LiquidGlassView
                tintColor="rgba(255,255,255,0.18)"
                borderRadius={16}
                style={styles.demoChip}
              >
                <Text style={styles.demoChipText}>▦ Cards</Text>
              </LiquidGlassView>
            </Pressable>
            <Pressable onPress={onShowMercury}>
              <LiquidGlassView
                tintColor="rgba(255,255,255,0.18)"
                borderRadius={16}
                style={styles.demoChip}
              >
                <Text style={styles.demoChipText}>⬮ Merge</Text>
              </LiquidGlassView>
            </Pressable>
            <Pressable onPress={onShowReel}>
              <LiquidGlassView
                tintColor="rgba(10,132,255,0.45)"
                borderRadius={16}
                style={styles.demoChip}
              >
                <Text style={styles.demoChipText}>▶ Demo</Text>
              </LiquidGlassView>
            </Pressable>
          </View>
        </View>
        <Text style={styles.subheading}>Liquid Glass · React Native</Text>

        {/* 0a. Interactive press target ------------------------------------- */}
        {/* A large, known-position interactive panel. Both platforms render it
            identically, so a press captured on each can be diffed against its
            own resting frame and the two deltas compared. */}
        <Text style={styles.section}>Press target</Text>
        <LiquidGlassView
          variant="clear"
          interactive
          borderRadius={28}
          style={styles.pressTarget}
        />

        {/* 0. SDF vs analytic, like for like -------------------------------- */}
        {/* The SAME circle, same size, same variant, drawn two ways: as a
            custom `shape` (signed-distance-field path) and as a rounded rect
            whose radius makes it a circle (analytic path). Anything that
            differs between these two is the SDF pipeline's error, not the
            design. */}
        <Text style={styles.section}>SDF shape vs analytic — same circle</Text>
        <View style={styles.abRow}>
          <View style={styles.abCell}>
            <LiquidGlassView
              variant="clear"
              shape={{ type: 'circle' }}
              style={styles.abGlass}
            />
            <Text style={styles.swatchLabel}>shape=circle (SDF)</Text>
          </View>
          <View style={styles.abCell}>
            <LiquidGlassView
              variant="clear"
              borderRadius={AB_SIZE / 2}
              style={styles.abGlass}
            />
            <Text style={styles.swatchLabel}>borderRadius (analytic)</Text>
          </View>
        </View>

        {/* 0b. Composition primitives --------------------------------------- */}
        {/* The same component standing in for the surfaces people normally
            reach for a BlurView or a translucent View to build. */}
        <Text style={styles.section}>Primitives — blur · scrim · glass</Text>
        <View style={styles.abRow}>
          <View style={styles.abCell}>
            <LiquidGlassView
              variant="clear"
              rim={false}
              specular={false}
              thickness={0}
              blurRadius={20}
              borderRadius={20}
              style={styles.primCell}
            />
            <Text style={styles.swatchLabel}>plain blur</Text>
          </View>
          <View style={styles.abCell}>
            <LiquidGlassView
              variant="clear"
              rim={false}
              specular={false}
              thickness={0}
              blurRadius={24}
              dim={0.45}
              borderRadius={20}
              style={styles.primCell}
            />
            <Text style={styles.swatchLabel}>modal scrim</Text>
          </View>
          <View style={styles.abCell}>
            <LiquidGlassView
              variant="clear"
              borderRadius={20}
              style={styles.primCell}
            />
            <Text style={styles.swatchLabel}>full glass</Text>
          </View>
        </View>

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
          <Text style={styles.tileBody}>Reacts to touch</Text>
          <Switch value={interactive} onValueChange={setInteractive} />
        </LiquidGlassView>
        <LiquidGlassView borderRadius={22} style={styles.rowCard}>
          <Text style={styles.tileBody}>Refraction (Android shader)</Text>
          <Switch value={refraction} onValueChange={setRefraction} />
        </LiquidGlassView>

        {/* 4. Custom shapes ------------------------------------------------- */}
        <Text style={styles.section}>Custom shapes</Text>
        <Text style={styles.note}>
          Any silhouette — the glass lenses the wallpaper through the shape, not
          just a clip.
        </Text>
        <View style={styles.rowWrap}>
          <ShapeSwatch label="Circle" shape={{ type: 'circle' }} />
          <ShapeSwatch label="Squircle" shape={{ type: 'squircle', n: 4 }} />
          <ShapeSwatch
            label="Hexagon"
            variant="clear"
            shape={{ type: 'polygon', sides: 6 }}
          />
          <ShapeSwatch
            label="Triangle"
            shape={{ type: 'polygon', sides: 3 }}
          />
          <ShapeSwatch
            label="Star"
            tintColor="rgba(255,214,10,0.45)"
            shape={{ type: 'points', points: STAR_POINTS }}
          />
        </View>

        {/* 4b. Bare clear glass — every silhouette as identical plain clear
            glass (no tint / children / touch), plus the analytic rounded-rect
            and the concave dock path, for direct side-by-side comparison. */}
        <Text style={styles.section}>Bare clear glass</Text>
        <Text style={styles.note}>
          Same plain clear glass everywhere — only the silhouette differs.
        </Text>
        <View style={styles.bareWrap}>
          {BARE_SHAPES.map((s) => (
            <BareSwatch key={s.label} label={s.label} shape={s.shape} />
          ))}
          <BareSwatch
            label="borderRadius"
            borderRadius={Math.round(BARE_SIZE * 0.28)}
          />
        </View>
        <LiquidGlassView
          variant="clear"
          shape={{
            type: 'path',
            d: BARE_DOCK_PATH,
            width: BARE_DOCK_W,
            height: DOCK_H,
          }}
          style={styles.bareDock}
        />
        <Text style={styles.swatchLabel}>dock path (concave)</Text>

        {/* 5. Rounded-rect shapes ------------------------------------------- */}
        <Text style={styles.section}>Rounded shapes</Text>
        <View style={styles.rowWrap}>
          <LiquidGlassView borderRadius={40} interactive style={styles.pill}>
            <Text style={styles.tileTitle}>Pill</Text>
          </LiquidGlassView>
          <LiquidGlassView
            variant="clear"
            borderRadius={16}
            style={styles.square}
          >
            <Text style={styles.tileTitle}>Card</Text>
          </LiquidGlassView>
        </View>

        {/* 5b. Clear-glass blur --------------------------------------------- */}
        {/* `clear` deliberately blurs far less than `regular` across the same
            `intensity` scale, so `blurRadius` gives it an exact value in dp.
            Compare these against the grid: 0 is a genuinely unblurred pane. */}
        <Text style={styles.section}>Clear glass · blurRadius</Text>
        <View style={styles.rowWrap}>
          {[0, 8, 16, 24].map((r) => (
            <LiquidGlassView
              key={r}
              variant="clear"
              blurRadius={r}
              borderRadius={16}
              style={styles.chip}
            >
              <Text style={styles.chipText}>{r}</Text>
            </LiquidGlassView>
          ))}
        </View>

        {/* Every silhouette as `clear` glass — transparent and refractive, so
            the grid reads straight through it — first at the variant's own
            light blur, then with an explicit radius. */}
        <Text style={styles.section}>Clear glass · custom shapes</Text>
        <View style={styles.rowWrap}>
          {BARE_SHAPES.map((s) => (
            <ShapeSwatch
              key={s.label}
              label={s.label}
              shape={s.shape}
              variant="clear"
            />
          ))}
        </View>

        <Text style={styles.section}>Clear shapes · blurRadius 18</Text>
        <View style={styles.rowWrap}>
          {BARE_SHAPES.map((s) => (
            <ShapeSwatch
              key={s.label}
              label={s.label}
              shape={s.shape}
              variant="clear"
              blurRadius={18}
            />
          ))}
        </View>

        {/* A wide, short bar is the shape that shows the lens easing off
            through the middle — its medial axis runs straight across it. */}
        <Text style={styles.section}>Wide bar</Text>
        <LiquidGlassView borderRadius={28} style={styles.wideBar}>
          <Text style={styles.tileTitle}>Tab bar</Text>
        </LiquidGlassView>

        {/* 6. Intensity ramp (pre-26 fallback) ------------------------------ */}
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

        {/* 7. Glass buttons ------------------------------------------------- */}
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

        <View style={{ height: 240 }} />
      </ScrollView>

      {/* 8. macOS-dock-style clear glass tray — floats just above the tab bar */}
      <View
        style={[styles.macDockWrap, { bottom: dockBottom + DOCK_H + 44 }]}
        pointerEvents="box-none"
      >
        <LiquidGlassView
          variant="clear"
          interactive
          borderRadius={28}
          style={styles.macDock}
        >
          <View style={styles.macDockRow}>
            {['◐', '✎', '✆', '⌾', '❖'].map((g, i) => (
              <Text key={i} style={styles.macDockGlyph}>
                {g}
              </Text>
            ))}
          </View>
        </LiquidGlassView>
      </View>

      {/* 9. Curved-notch glass tab bar (concave custom SVG shape) ---------- */}
      <CurvedDock bottom={dockBottom} />
    </View>
  );
}

// One big bare-glass swatch: plain clear glass, interactive (touch magnifier),
// with a press-scale like the dock's FAB. `shape` OR `borderRadius`.
function BareSwatch({
  label,
  shape,
  borderRadius,
}: {
  label: string;
  shape?: LiquidGlassShape;
  borderRadius?: number;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.bareSwatch, pressed && styles.barePressed]}
    >
      <LiquidGlassView
        variant="clear"
        interactive
        shape={shape}
        borderRadius={borderRadius}
        style={styles.bareGlass}
      />
      <Text style={styles.swatchLabel}>{label}</Text>
    </Pressable>
  );
}

function ShapeSwatch({
  label,
  shape,
  variant = 'regular',
  tintColor,
  blurRadius,
}: {
  label: string;
  shape: LiquidGlassShape;
  variant?: 'regular' | 'clear';
  tintColor?: string;
  blurRadius?: number;
}) {
  return (
    <View style={styles.swatch}>
      <LiquidGlassView
        variant={variant}
        interactive
        tintColor={tintColor}
        shape={shape}
        blurRadius={blurRadius}
        style={styles.swatchGlass}
      />
      <Text style={styles.swatchLabel}>{label}</Text>
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
  fill: { flex: 1 },
  content: { padding: 20, paddingTop: 72, gap: 8 },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: { fontSize: 36, fontWeight: '800', color: '#fff' },
  headingChips: { flexDirection: 'row', gap: 8 },
  demoChip: { paddingHorizontal: 14, paddingVertical: 9, overflow: 'hidden' },
  demoChipText: { color: '#fff', fontSize: 13, fontWeight: '700' },
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
  note: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 6 },

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

  // Custom-shape swatches: a fixed square canvas so circle/polygon/star aren't
  // stretched (the shape fills the view's bounds).
  abRow: { flexDirection: 'row', gap: 12 },
  abCell: { alignItems: 'center', gap: 6 },
  abGlass: { width: AB_SIZE, height: AB_SIZE },
  primCell: { width: PRIM_SIZE, height: PRIM_SIZE },
  pressTarget: { width: '100%', height: 220 },

  swatch: { alignItems: 'center', gap: 6, width: 84 },
  swatchGlass: { width: 84, height: 84 },
  swatchLabel: { fontSize: 12, color: 'rgba(255,255,255,0.85)' },

  bareWrap: { gap: 20 },
  bareSwatch: { alignItems: 'center', gap: 8, width: BARE_SIZE },
  barePressed: { transform: [{ scale: 0.97 }] },
  bareGlass: { width: BARE_SIZE, height: BARE_SIZE },
  bareDock: { width: BARE_DOCK_W, height: DOCK_H, marginTop: 6 },

  pill: { paddingHorizontal: 28, paddingVertical: 18, overflow: 'hidden' },
  wideBar: {
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
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

  // macOS-dock-style clear-glass tray (kept alongside the curved tab bar).
  macDockWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  macDock: {
    width: 320,
    height: 64,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  macDockRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 18,
  },
  macDockGlyph: { fontSize: 24, color: 'rgba(255,255,255,0.9)' },
});
