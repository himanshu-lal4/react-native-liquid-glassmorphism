import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  LiquidGlassView,
  GLASS_PRESET_NAMES,
  type LiquidGlassShape,
  type LiquidGlassViewProps,
} from 'react-native-liquid-glassmorphism';

// ─────────────────────────────────────────────────────────────────────────────
// WAYS TO USE IT — the library's whole range on one screen.
//
// Not a tour of app anatomy ("here is a nav bar"). Every prop that changes how
// the glass LOOKS, swept across its useful range, with the value printed under
// each swatch. Someone should be able to scroll this once and know what the
// library can and cannot make.
//
// The last group composes those knobs into the finished looks people arrive
// wanting: glassmorphism, liquid glass chrome, and a dimmed overlay.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Album-art colourways for the backdrop grid.
 *
 * A tuple type, not `string[]`, so indexing it cannot be `undefined` under
 * `noUncheckedIndexedAccess` — and `LinearGradient` requires at least two stops
 * anyway.
 */
const ART: ReadonlyArray<readonly [string, string]> = [
  ['#ff6a00', '#ee0979'],
  ['#00c6ff', '#0072ff'],
  ['#f7971e', '#ffd200'],
  ['#8e2de2', '#4a00e0'],
  ['#11998e', '#38ef7d'],
  ['#fc466b', '#3f5efb'],
];

// Built by repeating the palette rather than indexing it: this project enables
// `noUncheckedIndexedAccess`, so `ART[i % ART.length]` is `| undefined` and
// LinearGradient will not take that.
const ART_GRID = Array.from({ length: 6 }, () => ART).flat();

function starPoints(
  spikes: number,
  outer: number,
  inner: number
): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i / (spikes * 2)) * Math.PI * 2;
    pts.push([50 + Math.cos(a) * r, 50 + Math.sin(a) * r]);
  }
  return pts;
}

const SHAPES: Array<{ label: string; shape: LiquidGlassShape }> = [
  { label: 'circle', shape: { type: 'circle' } },
  { label: 'squircle', shape: { type: 'squircle', n: 4 } },
  { label: 'hexagon', shape: { type: 'polygon', sides: 6 } },
  { label: 'triangle', shape: { type: 'polygon', sides: 3 } },
  { label: 'star', shape: { type: 'points', points: starPoints(5, 50, 20) } },
  {
    label: 'svg path',
    shape: {
      type: 'path',
      d: 'M 50 88 C 20 64 4 46 4 28 C 4 12 16 4 28 4 C 38 4 46 10 50 18 C 54 10 62 4 72 4 C 84 4 96 12 96 28 C 96 46 80 64 50 88 Z',
      width: 100,
      height: 100,
    },
  },
];

/**
 * The backdrop every swatch sits over.
 *
 * Real artwork and real words, deliberately. An earlier version drew grey bars
 * and circles as a stand-in, which is exactly the shimmer-skeleton visual — it
 * made every example read as a loading state rather than a UI. Glass is only
 * ever as convincing as what is behind it.
 */
function Backdrop({ photo }: { photo?: boolean }) {
  if (photo) {
    return (
      <Image
        source={require('../assets/wallpaper.png')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
    );
  }
  return (
    <>
      <LinearGradient
        colors={['#241b4b', '#3d1e6d', '#7b2ff7']}
        style={StyleSheet.absoluteFill}
      />
      {/* A dense artwork grid rather than a list: a sweep puts swatches all
          across the stage, and any of them landing on empty gradient would
          make two different values look identical. */}
      <View style={styles.contentLayer} pointerEvents="none">
        {ART_GRID.map((colors, i) => (
          <LinearGradient key={i} colors={colors} style={styles.art} />
        ))}
      </View>
    </>
  );
}

/**
 * One prop, swept. Each swatch is the same glass with a single value changed
 * and that value printed underneath, so the row reads as a scale rather than a
 * collection.
 */
function Sweep({
  prop,
  note,
  items,
  photo,
  size = 78,
}: {
  prop: string;
  note: string;
  items: Array<{ label: string; props: LiquidGlassViewProps }>;
  photo?: boolean;
  size?: number;
}) {
  return (
    <View style={styles.sweep}>
      <Text style={styles.sweepTitle}>{prop}</Text>
      <Text style={styles.sweepNote}>{note}</Text>
      <View style={styles.stage}>
        <Backdrop photo={photo} />
        <View style={styles.swatchRow}>
          {items.map((it) => (
            <View key={it.label} style={styles.swatchCell}>
              <LiquidGlassView
                {...it.props}
                style={[{ width: size, height: size }, it.props.style]}
              />
              <Text style={styles.swatchLabel}>{it.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function UseCases({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#0b1020', '#141a33']}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40 },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.h1}>Ways to use it</Text>
          <LiquidGlassView
            preset="compactControl"
            borderRadius={14}
            style={styles.backChip}
            onTouchEnd={onBack}
          >
            <Text style={styles.backText}>← Back</Text>
          </LiquidGlassView>
        </View>
        <Text style={styles.sub}>
          Every knob, swept across its range — the value is printed under each
          swatch.
        </Text>

        {/* ═══ THE MATERIAL ═══════════════════════════════════════════════ */}
        <Group title="The material">
          <Sweep
            prop="variant"
            note="Two materials. `regular` is adaptive frosted glass; `clear` is high-transmission glass for photos and video."
            items={[
              {
                label: 'regular',
                props: { variant: 'regular', borderRadius: 18 },
              },
              { label: 'clear', props: { variant: 'clear', borderRadius: 18 } },
            ]}
            size={118}
          />

          <Sweep
            prop="blurRadius"
            note="An exact blur in dp, on either variant. 0 is a genuinely unblurred pane."
            items={[0, 8, 16, 24, 32].map((v) => ({
              label: String(v),
              props: { variant: 'clear', blurRadius: v, borderRadius: 16 },
            }))}
            size={60}
          />

          <Sweep
            prop="intensity"
            note="The 0–100 material strength, when you would rather not think in pixels."
            items={[0, 25, 50, 75, 100].map((v) => ({
              label: String(v),
              props: { intensity: v, borderRadius: 16 },
            }))}
            size={60}
          />

          <Sweep
            prop="tintColor"
            note="Any React Native colour. The rgba alpha controls how much of it lands."
            items={[
              { label: 'none', props: { borderRadius: 16 } },
              {
                label: 'white',
                props: {
                  tintColor: 'rgba(255,255,255,0.30)',
                  borderRadius: 16,
                },
              },
              {
                label: 'blue',
                props: { tintColor: 'rgba(10,132,255,0.45)', borderRadius: 16 },
              },
              {
                label: 'pink',
                props: { tintColor: 'rgba(255,55,95,0.45)', borderRadius: 16 },
              },
              {
                label: 'green',
                props: { tintColor: 'rgba(48,209,88,0.45)', borderRadius: 16 },
              },
            ]}
            size={60}
          />
        </Group>

        {/* ═══ THE OPTICS ═════════════════════════════════════════════════ */}
        <Group title="The optics">
          <Sweep
            prop="thickness"
            note="Liquid volume — how deep the lens reads. 0 is a flat pane, 2 a heavy lens. Android."
            photo
            items={[0, 0.5, 1, 1.5, 2].map((v) => ({
              label: String(v),
              props: { variant: 'clear', thickness: v, borderRadius: 16 },
            }))}
            size={60}
          />

          <Sweep
            prop="edgeReflectionStrength"
            note="The upside-down echo mirrored back at the rim. Calm it over text-heavy backdrops. Android."
            photo
            items={[0, 0.5, 1].map((v) => ({
              label: String(v),
              props: {
                variant: 'clear',
                edgeReflectionStrength: v,
                borderRadius: 16,
              },
            }))}
            size={92}
          />

          <Sweep
            prop="legibilityFloor"
            note="An adaptive veil under your children, so chrome stays readable over clear glass. Android."
            photo
            items={[0, 0.25, 0.5].map((v) => ({
              label: String(v),
              props: {
                variant: 'clear',
                legibilityFloor: v,
                borderRadius: 16,
              },
            }))}
            size={92}
          />
        </Group>

        {/* ═══ THE SHAPE ══════════════════════════════════════════════════ */}
        <Group title="The shape">
          <Sweep
            prop="borderRadius"
            note="Square through to pill."
            items={[0, 8, 20, 999].map((v) => ({
              label: v === 999 ? 'pill' : String(v),
              props: { variant: 'clear', borderRadius: v },
            }))}
            size={68}
          />

          <Sweep
            prop="shape"
            note="Any silhouette — the glass lenses the backdrop THROUGH it, which is not the same as clipping it."
            photo
            items={SHAPES.map((s) => ({
              label: s.label,
              props: { variant: 'clear', shape: s.shape },
            }))}
            size={60}
          />
        </Group>

        {/* ═══ THE LAYERS ═════════════════════════════════════════════════ */}
        <Group title="The layers — switch any of them off">
          <Sweep
            prop="rim · specular · dim"
            note="Turn the glass decoration off and the same component is a plain blur view, or a dimmed scrim. This is how it replaces a blur library."
            items={[
              { label: 'all on', props: { variant: 'clear', borderRadius: 16 } },
              {
                label: 'rim off',
                props: { variant: 'clear', rim: false, borderRadius: 16 },
              },
              {
                label: 'plain blur',
                props: {
                  variant: 'clear',
                  rim: false,
                  specular: false,
                  thickness: 0,
                  blurRadius: 18,
                  borderRadius: 16,
                },
              },
              {
                label: 'dim 0.5',
                props: {
                  variant: 'clear',
                  rim: false,
                  specular: false,
                  thickness: 0,
                  blurRadius: 18,
                  dim: 0.5,
                  borderRadius: 16,
                },
              },
            ]}
            size={68}
          />
        </Group>

        {/* ═══ PRESETS ════════════════════════════════════════════════════ */}
        <Group title="Presets — a tuned starting point">
          <Sweep
            prop="preset"
            note="Six whole-material configurations. Any prop you also pass wins over the preset."
            items={GLASS_PRESET_NAMES.map((name) => ({
              label: name,
              props: { preset: name },
            }))}
            size={52}
          />
        </Group>

        {/* ═══ COMPOSED LOOKS ═════════════════════════════════════════════ */}
        <Group title="Put together">
          <Text style={styles.sweepNote}>
            The same knobs, composed into the looks people arrive wanting.
          </Text>

          <View style={styles.lookStage}>
            <View style={styles.blobGround} />
            <View style={[styles.blob, styles.blobA]} />
            <View style={[styles.blob, styles.blobB]} />
            <View style={[styles.blob, styles.blobC]} />
            <LiquidGlassView
              variant="regular"
              tintColor="rgba(255,255,255,0.22)"
              blurRadius={20}
              borderRadius={24}
              style={styles.authCard}
            >
              <Text style={styles.authTitle}>Glassmorphism</Text>
              <View style={styles.field}>
                <Text style={styles.fieldText}>you@example.com</Text>
              </View>
              <View style={styles.authBtn}>
                <Text style={styles.authBtnText}>Sign in</Text>
              </View>
            </LiquidGlassView>
          </View>
          <Text style={styles.lookLabel}>
            glassmorphism — colour blobs, white wash, hairline edge
          </Text>

          <View style={styles.lookStage}>
            <Backdrop photo />
            <LiquidGlassView preset="floatingTabBar" style={styles.tabBar}>
              <View style={styles.tabRow}>
                {['Home', 'Search', 'Saved', 'Me'].map((t, i) => (
                  <Text
                    key={t}
                    style={[styles.tab, i === 0 && styles.tabActive]}
                  >
                    {t}
                  </Text>
                ))}
              </View>
            </LiquidGlassView>
          </View>
          <Text style={styles.lookLabel}>
            liquid glass — refractive chrome over content
          </Text>

          <View style={styles.lookStage}>
            <Backdrop />
            <LiquidGlassView
              rim={false}
              specular={false}
              thickness={0}
              blurRadius={22}
              dim={0.45}
              style={StyleSheet.absoluteFill}
            />
            <LiquidGlassView
              variant="regular"
              borderRadius={22}
              legibilityFloor={0.25}
              style={styles.sheet}
            >
              <View style={styles.grabber} />
              <Text style={styles.sheetTitle}>Modal backdrop</Text>
              <Text style={styles.sheetBody}>
                blur + dim, then a sheet on top
              </Text>
            </LiquidGlassView>
          </View>
          <Text style={styles.lookLabel}>
            overlay — the scrim primitive, on both platforms
          </Text>
        </Group>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b1020' },
  content: { paddingHorizontal: 16, gap: 26 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  h1: { fontSize: 28, fontWeight: '800', color: '#fff' },
  backChip: { paddingHorizontal: 14, paddingVertical: 9, overflow: 'hidden' },
  backText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  sub: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: -18 },

  group: { gap: 18 },
  groupTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.42)',
  },

  sweep: { gap: 7 },
  sweepTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  sweepNote: { fontSize: 12.5, lineHeight: 17, color: 'rgba(255,255,255,0.6)' },

  stage: {
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  contentLayer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 7,
  },
  art: { width: 44, height: 44, borderRadius: 9 },

  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 10,
  },
  swatchCell: { alignItems: 'center', gap: 5 },
  swatchLabel: {
    color: '#fff',
    fontSize: 10.5,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.65)',
    textShadowRadius: 3,
  },

  lookStage: {
    height: 210,
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  lookLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    marginTop: -10,
  },

  blobGround: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0c0a1a' },
  blob: { position: 'absolute', borderRadius: 999 },
  blobA: {
    width: 230,
    height: 230,
    backgroundColor: '#ff2d90',
    top: -70,
    left: -55,
    opacity: 0.62,
  },
  blobB: {
    width: 210,
    height: 210,
    backgroundColor: '#00e0ff',
    bottom: -75,
    right: -40,
    opacity: 0.58,
  },
  blobC: {
    width: 175,
    height: 175,
    backgroundColor: '#ffd60a',
    top: 25,
    right: 55,
    opacity: 0.45,
  },

  authCard: { marginHorizontal: 26, padding: 18, gap: 10, overflow: 'hidden' },
  authTitle: { color: '#fff', fontSize: 19, fontWeight: '800' },
  field: {
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.16)',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  fieldText: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  authBtn: {
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authBtnText: { color: '#12102a', fontWeight: '800', fontSize: 14 },

  tabBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    height: 58,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tabRow: { flexDirection: 'row', justifyContent: 'space-around' },
  tab: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600' },
  tabActive: { color: '#fff', fontWeight: '800' },

  sheet: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 14,
    padding: 16,
    alignItems: 'center',
    overflow: 'hidden',
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginBottom: 10,
  },
  sheetTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  sheetBody: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 },
});
