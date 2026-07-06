import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  LiquidGlassView,
  type LiquidGlassShape,
} from 'react-native-liquid-glassmorphism';
import { CurvedDock, DOCK_H } from './CurvedDock';

// ─────────────────────────────────────────────────────────────────────────────
// DEMO REEL — a self-playing showcase designed to be screen-recorded into the
// README GIF. Six scenes auto-advance with a crossfade:
//
//   1. Hero        — wordmark with a drifting glass lens refracting the title
//   2. iOS 26      — notification banner + Control Center tiles + slider
//   3. Navigation  — segmented control, toolbar buttons, search, notch tab bar
//   4. macOS Tahoe — menu bar, window with glass sidebar, squircle dock
//   5. Any shape   — one glass morphing circle→squircle→hexagon→star→heart→blob
//   6. Closer      — the two USPs + npm install
//
// Tap anywhere to skip ahead; long-press to return to the API gallery.
// ─────────────────────────────────────────────────────────────────────────────

const MONO = Platform.select({ ios: 'Menlo', default: 'monospace' });

// The reel runs identically on both platforms — this badge is what tells a
// viewer of the recording *which* one they're looking at, so the Android GIF
// unmistakably reads "Liquid Glass · Android" (the whole point of the library).
const PLATFORM_LABEL = Platform.select({ ios: 'iOS', android: 'Android', default: 'Web' });
const PLATFORM_ACCENT = Platform.select({
  ios: 'rgb(10,132,255)',
  default: 'rgb(48,209,88)',
});

// ── Shapes shared across scenes ──────────────────────────────────────────────

function starPoints(spikes: number, outer: number, inner: number) {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i / (spikes * 2)) * Math.PI * 2;
    pts.push([50 + Math.cos(a) * r, 50 + Math.sin(a) * r]);
  }
  return pts;
}

const STAR: LiquidGlassShape = { type: 'points', points: starPoints(5, 50, 21) };

// Heart and blob authored as cubic béziers (the shape engine takes any SVG
// path — arcs excluded — so curves are expressed as C segments).
const HEART: LiquidGlassShape = {
  type: 'path',
  d: 'M 50 88 C 20 64 4 46 4 28 C 4 12 16 4 28 4 C 38 4 46 10 50 18 C 54 10 62 4 72 4 C 84 4 96 12 96 28 C 96 46 80 64 50 88 Z',
  width: 100,
  height: 100,
};

const BLOB: LiquidGlassShape = {
  type: 'path',
  d: 'M 50 6 C 72 2 92 18 94 40 C 96 62 84 88 60 92 C 36 96 10 84 6 60 C 2 36 20 12 50 6 Z',
  width: 100,
  height: 100,
};

// ── Small animation helpers ──────────────────────────────────────────────────

// Pause switch for everything that moves — lets the reel be frozen for clean
// screenshots. Loops, morph timers and auto-advance all read this.
const PausedContext = createContext(false);

/** 0→1→0 sine loop, native-driver friendly. Freezes while the reel is paused. */
function useLoop(duration: number, delay = 0) {
  const v = useRef(new Animated.Value(0)).current;
  const paused = useContext(PausedContext);
  useEffect(() => {
    if (paused) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(v, {
          toValue: 1,
          duration,
          delay,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(v, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [v, duration, delay, paused]);
  return v;
}

/**
 * Slide-up spring entrance on mount, optionally staggered.
 *
 * Deliberately transform-only: animating opacity above a `UIGlassEffect`
 * ancestor permanently breaks the glass material on iOS 26 (the effect never
 * recovers once its alpha dips below 1), so entrances slide instead of fade.
 */
function Enter({
  delay = 0,
  children,
  style,
}: {
  delay?: number;
  children: React.ReactNode;
  style?: object;
}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.spring(v, {
      toValue: 1,
      delay,
      friction: 9,
      tension: 60,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [v, delay]);
  return (
    <Animated.View
      style={[
        style,
        {
          transform: [
            { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [42, 0] }) },
            { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

// Drifting gradient orbs behind every scene: constant motion under the glass so
// the blur + lensing visibly track live content in the recording.
function FloatingOrbs() {
  const { width, height } = useWindowDimensions();
  const a = useLoop(6400);
  const b = useLoop(8200, 600);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View
        style={[
          styles.orb,
          {
            top: height * 0.16,
            left: -60,
            transform: [
              { translateX: a.interpolate({ inputRange: [0, 1], outputRange: [0, width * 0.55] }) },
              { translateY: a.interpolate({ inputRange: [0, 1], outputRange: [0, 130] }) },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(255,95,109,0.85)', 'rgba(255,195,113,0.55)']}
          style={styles.orbFill}
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.orb,
          {
            top: height * 0.58,
            right: -70,
            transform: [
              { translateX: b.interpolate({ inputRange: [0, 1], outputRange: [0, -width * 0.5] }) },
              { translateY: b.interpolate({ inputRange: [0, 1], outputRange: [0, -150] }) },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(54,209,220,0.8)', 'rgba(91,134,229,0.5)']}
          style={styles.orbFill}
        />
      </Animated.View>
    </View>
  );
}

// Always-on, top-center: brands every scene as "Liquid Glass" and labels the
// running platform so each recording self-identifies.
function PlatformBadge({ top }: { top: number }) {
  return (
    <View style={[styles.badgeWrap, { top }]} pointerEvents="none">
      <LiquidGlassView
        variant="clear"
        tintColor="rgba(0,0,0,0.3)"
        borderRadius={15}
        style={styles.badge}
      >
        <View style={[styles.badgeDot, { backgroundColor: PLATFORM_ACCENT }]} />
        <Text style={styles.badgeText}>Liquid Glass · {PLATFORM_LABEL}</Text>
      </LiquidGlassView>
    </View>
  );
}

function Caption({ text, bottom }: { text: string; bottom: number }) {
  return (
    <View style={[styles.captionWrap, { bottom }]} pointerEvents="none">
      <LiquidGlassView tintColor="rgba(0,0,0,0.28)" borderRadius={18} style={styles.caption}>
        <Text style={styles.captionText}>{text}</Text>
      </LiquidGlassView>
    </View>
  );
}

// ── Scene 1: Hero ────────────────────────────────────────────────────────────

function HeroScene() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const x = useLoop(5200);
  const y = useLoop(3900, 300);
  return (
    <View style={styles.fill}>
      <View style={styles.center}>
        <Enter>
          <Text style={styles.heroKicker}>REACT NATIVE</Text>
          <Text style={styles.heroTitle}>Liquid{'\n'}Glass</Text>
        </Enter>
        <Enter delay={200}>
          <View style={styles.chipRow}>
            {['Liquid Glass', 'Android', 'Any shape'].map((label) => (
              <LiquidGlassView key={label} variant="clear" borderRadius={16} style={styles.chip}>
                <Text style={styles.chipText}>{label}</Text>
              </LiquidGlassView>
            ))}
          </View>
        </Enter>
      </View>

      {/* A clear-glass lens drifting over the wordmark: everything under it —
          text included — is refracted live, on both platforms. */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.heroLens,
          {
            transform: [
              { translateX: x.interpolate({ inputRange: [0, 1], outputRange: [-width * 0.24, width * 0.24] }) },
              { translateY: y.interpolate({ inputRange: [0, 1], outputRange: [-58, 70] }) },
            ],
          },
        ]}
      >
        <LiquidGlassView
          variant="clear"
          thickness={1.5}
          shape={{ type: 'circle' }}
          style={styles.heroLensGlass}
        />
      </Animated.View>

      <Caption text="Liquid Glass · in React Native" bottom={insets.bottom + 30} />
    </View>
  );
}

// ── Scene 2: iOS 26 — notifications + Control Center ────────────────────────

const CC_TILES = [
  { glyph: '✈', label: 'Airplane', tint: 'rgba(255,159,10,0.5)' },
  { glyph: '☾', label: 'Focus', tint: 'rgba(94,92,230,0.5)' },
  { glyph: '♫', label: 'Music', tint: undefined },
  { glyph: '⌖', label: 'Location', tint: undefined },
];

function IOSScene() {
  const insets = useSafeAreaInsets();
  const slide = useLoop(2600);
  return (
    <View style={styles.fill}>
      <View style={[styles.sceneBody, { paddingTop: insets.top + 26 }]}>
        <Enter>
          <Text style={styles.clock}>9:41</Text>
          <Text style={styles.clockDate}>Friday, July 4</Text>
        </Enter>

        <Enter delay={150} style={styles.blockGap}>
          <LiquidGlassView borderRadius={24} style={styles.notification}>
            <LiquidGlassView
              tintColor="rgba(48,209,88,0.55)"
              shape={{ type: 'circle' }}
              style={styles.notifIcon}
            >
              <Text style={styles.notifGlyph}>✆</Text>
            </LiquidGlassView>
            <View style={styles.notifBody}>
              <View style={styles.notifTitleRow}>
                <Text style={styles.notifTitle}>FaceTime</Text>
                <Text style={styles.notifTime}>now</Text>
              </View>
              <Text style={styles.notifText}>Glass over anything — it adapts.</Text>
            </View>
          </LiquidGlassView>
        </Enter>

        <View style={[styles.ccGrid, styles.blockGap]}>
          {CC_TILES.map((t, i) => (
            <Enter key={t.label} delay={250 + i * 90}>
              <LiquidGlassView
                interactive
                tintColor={t.tint}
                borderRadius={26}
                style={styles.ccTile}
              >
                <Text style={styles.ccGlyph}>{t.glyph}</Text>
                <Text style={styles.ccLabel}>{t.label}</Text>
              </LiquidGlassView>
            </Enter>
          ))}
        </View>

        {/* Brightness slider — the white fill sweeps inside a glass track. */}
        <Enter delay={650} style={styles.blockGap}>
          <LiquidGlassView borderRadius={22} style={styles.slider}>
            <Animated.View
              style={[
                styles.sliderFill,
                {
                  transform: [
                    { translateX: slide.interpolate({ inputRange: [0, 1], outputRange: [-150, -40] }) },
                  ],
                },
              ]}
            />
            <Text style={styles.sliderGlyph}>☼</Text>
          </LiquidGlassView>
        </Enter>
      </View>
      <Caption text="Notifications & Control Center" bottom={insets.bottom + 30} />
    </View>
  );
}

// ── Scene 3: iOS 26 — navigation chrome ──────────────────────────────────────

const SEGMENTS = ['Years', 'Months', 'All Photos'];

function NavScene() {
  const insets = useSafeAreaInsets();
  const [seg, setSeg] = useState(0);
  const segX = useRef(new Animated.Value(0)).current;
  const paused = useContext(PausedContext);

  // The selection pill hops between segments on a timer — motion for the GIF.
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setSeg((s) => {
        const next = (s + 1) % SEGMENTS.length;
        Animated.spring(segX, {
          toValue: next,
          useNativeDriver: true,
          friction: 9,
          tension: 90,
        }).start();
        return next;
      });
    }, 1400);
    return () => clearInterval(id);
  }, [segX, paused]);

  const segW = (300 - 8) / SEGMENTS.length;
  const dockBottom =
    Platform.OS === 'android' ? insets.bottom + 4 : insets.bottom;

  return (
    <View style={styles.fill}>
      <View style={[styles.sceneBody, { paddingTop: insets.top + 60 }]}>
        <Enter>
          <LiquidGlassView borderRadius={22} style={styles.segmented}>
            <Animated.View
              style={[
                styles.segIndicator,
                {
                  width: segW,
                  transform: [
                    { translateX: segX.interpolate({ inputRange: [0, SEGMENTS.length - 1], outputRange: [0, segW * (SEGMENTS.length - 1)] }) },
                  ],
                },
              ]}
            />
            {SEGMENTS.map((s, i) => (
              <View key={s} style={[styles.segItem, { width: segW }]}>
                <Text style={[styles.segText, seg === i && styles.segTextActive]}>{s}</Text>
              </View>
            ))}
          </LiquidGlassView>
        </Enter>

        <Enter delay={150} style={styles.blockGap}>
          <View style={styles.toolbarRow}>
            {['‹', '⇪', '♡', '⋯'].map((g) => (
              <LiquidGlassView
                key={g}
                variant="clear"
                interactive
                shape={{ type: 'circle' }}
                style={styles.toolButton}
              >
                <Text style={styles.toolGlyph}>{g}</Text>
              </LiquidGlassView>
            ))}
          </View>
        </Enter>

        <Enter delay={300} style={styles.blockGap}>
          <LiquidGlassView borderRadius={26} style={styles.search}>
            <Text style={styles.searchText}>⌕ Search</Text>
          </LiquidGlassView>
        </Enter>
      </View>

      <Caption
        text="Toolbars, search & tab bars"
        bottom={dockBottom + DOCK_H + 26}
      />
      {/* The concave-notch tab bar — a custom SVG-path silhouette. */}
      <CurvedDock bottom={dockBottom} />
    </View>
  );
}

// ── Scene 4: macOS Tahoe ─────────────────────────────────────────────────────

const SIDEBAR = ['⊙ Recents', '⌂ Home', '⌘ Apps', '✎ Notes', '♫ Music'];
const DOCK_APPS = [
  { glyph: '✆', tint: 'rgba(48,209,88,0.55)' },
  { glyph: '⌕', tint: 'rgba(10,132,255,0.55)' },
  { glyph: '♫', tint: 'rgba(255,55,95,0.55)' },
  { glyph: '✎', tint: 'rgba(255,214,10,0.5)' },
  // U+FE0E forces text presentation — bare U+2699 is tofu in SF on iOS.
  { glyph: '⚙︎', tint: undefined },
];

function MacScene() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const winW = Math.min(width - 32, 380);
  return (
    <View style={styles.fill}>
      <View style={[styles.sceneBody, { paddingTop: insets.top + 56 }]}>
        {/* Menu bar */}
        <Enter>
          <LiquidGlassView variant="clear" borderRadius={14} style={[styles.menuBar, { width: winW }]}>
            <Text style={styles.menuText}>❖  Finder   File   Edit   View</Text>
            <Text style={styles.menuText}>Fri 9:41</Text>
          </LiquidGlassView>
        </Enter>

        {/* Window with glass sidebar */}
        <Enter delay={180} style={styles.blockGap}>
          <LiquidGlassView borderRadius={20} style={[styles.window, { width: winW }]}>
            <View style={styles.windowHeader}>
              <View style={[styles.trafficDot, { backgroundColor: '#ff5f57' }]} />
              <View style={[styles.trafficDot, { backgroundColor: '#febc2e' }]} />
              <View style={[styles.trafficDot, { backgroundColor: '#28c840' }]} />
              <Text style={styles.windowTitle}>Glassmorphism</Text>
            </View>
            <View style={styles.windowBody}>
              <LiquidGlassView variant="clear" borderRadius={14} style={styles.sidebar}>
                {SIDEBAR.map((s, i) => (
                  <Text key={s} style={[styles.sidebarItem, i === 0 && styles.sidebarActive]}>
                    {s}
                  </Text>
                ))}
              </LiquidGlassView>
              <View style={styles.windowContent}>
                {[0.9, 0.65, 0.8, 0.5].map((w, i) => (
                  <View key={i} style={[styles.ghostLine, { width: `${w * 100}%` }]} />
                ))}
                <LiquidGlassView
                  tintColor="rgba(10,132,255,0.5)"
                  interactive
                  borderRadius={15}
                  style={styles.windowButton}
                >
                  <Text style={styles.windowButtonText}>Continue</Text>
                </LiquidGlassView>
              </View>
            </View>
          </LiquidGlassView>
        </Enter>

        {/* Dock */}
        <Enter delay={360} style={styles.blockGap}>
          <LiquidGlassView variant="clear" borderRadius={30} style={styles.macDock}>
            <View style={styles.macDockRow}>
              {DOCK_APPS.map((a, i) => (
                <Enter key={i} delay={420 + i * 70}>
                  <LiquidGlassView
                    interactive
                    tintColor={a.tint}
                    shape={{ type: 'squircle', n: 4 }}
                    style={styles.macDockIcon}
                  >
                    <Text style={styles.macDockGlyph}>{a.glyph}</Text>
                  </LiquidGlassView>
                </Enter>
              ))}
            </View>
          </LiquidGlassView>
        </Enter>
      </View>
      <Caption text="Desktop · menu bar, windows & dock" bottom={insets.bottom + 30} />
    </View>
  );
}

// ── Scene 5: Any shape (USP #2) ──────────────────────────────────────────────

// `label` is the literal prop the morphing view is being given right now —
// it's shown as code under the glass, so keep it honest.
const MORPH_SHAPES: Array<{ label: string; shape: LiquidGlassShape; tint?: string }> = [
  { label: "{ type: 'circle' }", shape: { type: 'circle' } },
  { label: "{ type: 'squircle', n: 4 }", shape: { type: 'squircle', n: 4 } },
  { label: "{ type: 'polygon', sides: 6 }", shape: { type: 'polygon', sides: 6 } },
  { label: "{ type: 'points', points }", shape: STAR, tint: 'rgba(255,214,10,0.4)' },
  { label: "{ type: 'path', d: heart }", shape: HEART, tint: 'rgba(255,55,95,0.4)' },
  { label: "{ type: 'path', d: blob }", shape: BLOB },
];

function ShapesScene() {
  const insets = useSafeAreaInsets();
  const [idx, setIdx] = useState(0);
  const pulse = useRef(new Animated.Value(0)).current;
  const paused = useContext(PausedContext);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % MORPH_SHAPES.length);
      pulse.setValue(0);
      Animated.spring(pulse, {
        toValue: 1,
        useNativeDriver: true,
        friction: 5,
        tension: 120,
      }).start();
    }, 900);
    return () => clearInterval(id);
  }, [pulse, paused]);

  const current = MORPH_SHAPES[idx]!;

  return (
    <View style={styles.fill}>
      <View style={styles.center}>
        <Enter>
          <Text style={styles.shapesTitle}>Any silhouette</Text>
          <Text style={styles.shapesSub}>
            Concave or convex — real lensing, not a clip
          </Text>
        </Enter>

        <Animated.View
          style={[
            styles.morphWrap,
            {
              transform: [
                { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] }) },
              ],
            },
          ]}
        >
          <LiquidGlassView
            variant="clear"
            interactive
            thickness={1.3}
            tintColor={current.tint}
            shape={current.shape}
            style={styles.morphGlass}
          />
        </Animated.View>
        <Text style={styles.morphLabel}>
          {`shape={${current.label}}`}
        </Text>

        <Enter delay={250}>
          <View style={styles.miniRow}>
            <LiquidGlassView shape={{ type: 'polygon', sides: 3 }} style={styles.mini} />
            <LiquidGlassView shape={{ type: 'polygon', sides: 6 }} style={styles.mini} />
            <LiquidGlassView tintColor="rgba(255,214,10,0.22)" shape={STAR} style={styles.mini} />
            <LiquidGlassView tintColor="rgba(255,55,95,0.22)" shape={HEART} style={styles.mini} />
            <LiquidGlassView shape={BLOB} style={styles.mini} />
          </View>
        </Enter>
      </View>
      <Caption text="Custom shapes · one API" bottom={insets.bottom + 30} />
    </View>
  );
}

// ── Scene 6: Closer (USP #1) ─────────────────────────────────────────────────

function CloserScene() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  return (
    <View style={styles.fill}>
      <View style={styles.center}>
        <Enter>
          <LiquidGlassView borderRadius={30} style={[styles.usp, { width: Math.min(width - 36, 380) }]}>
            <Text style={styles.uspHeading}>One component.</Text>

            <View style={styles.uspRow}>
              <LiquidGlassView
                tintColor="rgba(48,209,88,0.5)"
                shape={{ type: 'circle' }}
                style={styles.uspBadge}
              >
                <Text style={styles.uspBadgeText}>1</Text>
              </LiquidGlassView>
              <View style={styles.uspBody}>
                <Text style={styles.uspTitle}>Liquid Glass on Android</Text>
                <Text style={styles.uspText}>
                  AGSL edge lensing & refraction — not just a blur.
                </Text>
              </View>
            </View>

            <View style={styles.uspRow}>
              <LiquidGlassView
                tintColor="rgba(10,132,255,0.5)"
                shape={{ type: 'circle' }}
                style={styles.uspBadge}
              >
                <Text style={styles.uspBadgeText}>2</Text>
              </LiquidGlassView>
              <View style={styles.uspBody}>
                <Text style={styles.uspTitle}>Any shape, both platforms</Text>
                <Text style={styles.uspText}>
                  SDF silhouettes on Android · masked UIGlassEffect on iOS.
                </Text>
              </View>
            </View>
          </LiquidGlassView>
        </Enter>

        <Enter delay={250} style={styles.blockGap}>
          <LiquidGlassView tintColor="rgba(0,0,0,0.35)" borderRadius={18} style={styles.npm}>
            <Text style={styles.npmText}>npm i react-native-liquid-glassmorphism</Text>
          </LiquidGlassView>
        </Enter>
      </View>
      <Caption text="Expo config plugin included · MIT" bottom={insets.bottom + 30} />
    </View>
  );
}

// ── The reel ─────────────────────────────────────────────────────────────────

const SCENES = [
  { key: 'hero', duration: 4200, render: () => <HeroScene /> },
  { key: 'ios', duration: 4800, render: () => <IOSScene /> },
  { key: 'nav', duration: 4800, render: () => <NavScene /> },
  { key: 'macos', duration: 5000, render: () => <MacScene /> },
  { key: 'shapes', duration: 5600, render: () => <ShapesScene /> },
  { key: 'closer', duration: 4800, render: () => <CloserScene /> },
] as const;

export default function DemoReel({ onExit }: { onExit: () => void }) {
  const [idx, setIdx] = useState(0);
  const insets = useSafeAreaInsets();

  // Hard-cut scene changes (each scene's content springs in via <Enter>).
  // No crossfade on purpose — see the note on <Enter> about the glass
  // breaking under animated opacity.
  const go = useCallback((next: number) => setIdx(next % SCENES.length), []);

  useEffect(() => {
    const t = setTimeout(() => go(idx + 1), SCENES[idx]!.duration);
    return () => clearTimeout(t);
  }, [idx, go]);

  return (
    <PausedContext.Provider value={false}>
      {/* Hidden so every scene reads as pure content in the recording. */}
      <StatusBar hidden />
      <Pressable style={styles.fill} onPress={() => go(idx + 1)} onLongPress={onExit}>
        <FloatingOrbs />
        <View style={StyleSheet.absoluteFill} key={SCENES[idx]!.key}>
          {SCENES[idx]!.render()}
        </View>

        <PlatformBadge top={insets.top + 10} />
      </Pressable>
    </PausedContext.Provider>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const SHADOW = {
  textShadowColor: 'rgba(0,0,0,0.4)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 8,
} as const;

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 },
  sceneBody: { flex: 1, alignItems: 'center', paddingHorizontal: 18 },
  blockGap: { marginTop: 18 },

  orb: { position: 'absolute', width: 230, height: 230 },
  orbFill: { flex: 1, borderRadius: 999 },

  // Persistent platform badge, top-center.
  badgeWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 10 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  badgeDot: { width: 7, height: 7, borderRadius: 4 },
  badgeText: { color: '#fff', fontSize: 12.5, fontWeight: '700', letterSpacing: 0.2 },

  captionWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  caption: { paddingHorizontal: 18, paddingVertical: 10, overflow: 'hidden' },
  captionText: { color: 'rgba(255,255,255,0.95)', fontSize: 13, fontWeight: '600' },

  // Hero
  heroKicker: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 6,
    textAlign: 'center',
    ...SHADOW,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 74,
    lineHeight: 78,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 8,
    ...SHADOW,
  },
  chipRow: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginTop: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, overflow: 'hidden' },
  chipText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  heroLens: { position: 'absolute', top: '48%', alignSelf: 'center' },
  heroLensGlass: { width: 158, height: 158 },

  // iOS scene
  clock: { color: '#fff', fontSize: 64, fontWeight: '700', textAlign: 'center', ...SHADOW },
  clockDate: { color: 'rgba(255,255,255,0.85)', fontSize: 15, textAlign: 'center', ...SHADOW },
  notification: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    width: 330,
    overflow: 'hidden',
  },
  notifIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  notifGlyph: { color: '#fff', fontSize: 19 },
  notifBody: { flex: 1 },
  notifTitleRow: { flexDirection: 'row', justifyContent: 'space-between' },
  notifTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  notifTime: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  notifText: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 2 },
  ccGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 236,
    gap: 12,
    justifyContent: 'center',
  },
  ccTile: {
    width: 112,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    overflow: 'hidden',
  },
  ccGlyph: { color: '#fff', fontSize: 30 },
  ccLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' },
  slider: {
    width: 236,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  sliderFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  sliderGlyph: { color: 'rgba(60,60,70,0.9)', fontSize: 20 },

  // Nav scene
  segmented: {
    width: 300,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    overflow: 'hidden',
  },
  segIndicator: {
    position: 'absolute',
    left: 4,
    top: 4,
    bottom: 4,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.32)',
  },
  segItem: { alignItems: 'center', justifyContent: 'center' },
  segText: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600' },
  segTextActive: { color: '#fff' },
  toolbarRow: { flexDirection: 'row', gap: 14 },
  toolButton: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  toolGlyph: { color: '#fff', fontSize: 21 },
  search: {
    width: 300,
    paddingVertical: 14,
    paddingHorizontal: 18,
    overflow: 'hidden',
  },
  searchText: { color: 'rgba(255,255,255,0.8)', fontSize: 15 },

  // macOS scene
  menuBar: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    overflow: 'hidden',
  },
  menuText: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600' },
  window: { height: 296, overflow: 'hidden' },
  windowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 9,
  },
  trafficDot: { width: 12, height: 12, borderRadius: 6 },
  windowTitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
  windowBody: { flex: 1, flexDirection: 'row', gap: 10, padding: 10, paddingTop: 2 },
  sidebar: { width: 108, padding: 10, gap: 12, overflow: 'hidden' },
  sidebarItem: { color: 'rgba(255,255,255,0.7)', fontSize: 12.5 },
  sidebarActive: { color: '#fff', fontWeight: '700' },
  windowContent: { flex: 1, paddingTop: 8, gap: 12 },
  ghostLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  windowButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 6,
    overflow: 'hidden',
  },
  windowButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  macDock: { paddingHorizontal: 14, paddingVertical: 11, overflow: 'hidden' },
  macDockRow: { flexDirection: 'row', gap: 12 },
  macDockIcon: { width: 54, height: 54, alignItems: 'center', justifyContent: 'center' },
  macDockGlyph: { color: '#fff', fontSize: 23 },

  // Shapes scene
  shapesTitle: { color: '#fff', fontSize: 40, fontWeight: '800', textAlign: 'center', ...SHADOW },
  shapesSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    ...SHADOW,
  },
  morphWrap: { marginTop: 6 },
  morphGlass: { width: 170, height: 170 },
  morphLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontFamily: MONO,
    ...SHADOW,
  },
  miniRow: { flexDirection: 'row', gap: 14, marginTop: 8 },
  mini: { width: 56, height: 56 },

  // Closer
  usp: { padding: 22, gap: 18, overflow: 'hidden' },
  uspHeading: { color: '#fff', fontSize: 26, fontWeight: '800' },
  uspRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  uspBadge: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  uspBadgeText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  uspBody: { flex: 1 },
  uspTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  uspText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 },
  npm: { paddingHorizontal: 16, paddingVertical: 12, overflow: 'hidden' },
  npmText: { color: '#d7ffd9', fontSize: 12.5, fontFamily: MONO },
});
