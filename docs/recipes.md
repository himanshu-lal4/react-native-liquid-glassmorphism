---
layout: page
title: "Recipes — Glass UI Snippets"
description: "Copy-paste React Native Liquid Glass recipes: a frosted glass nav bar, a glass card, clear-glass media controls, and a concave notched tab bar."
permalink: /recipes/
---

# Recipes

Ready-to-paste snippets for common **Liquid Glass** UI in React Native. Every
recipe is self-contained — imports included — and works on both iOS and Android
with [`react-native-liquid-glassmorphism`]({{ site.npm_url }}). See
[Getting started]({{ '/getting-started/' | relative_url }}) to install first.

All of these are lifted from the [`example/`]({{ site.repo_url }}/tree/main/example)
gallery app, so you can see them running on a device too.

## Frosted glass navigation bar

A translucent top bar that floats over scrolling content — the backdrop is
refracted through the glass, so whatever scrolls under it stays legible.

{% raw %}
```tsx
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LiquidGlassView } from 'react-native-liquid-glassmorphism';

function GlassNavBar({ title }: { title: string }) {
  const insets = useSafeAreaInsets();
  return (
    <LiquidGlassView
      variant="regular"
      style={[styles.navBar, { paddingTop: insets.top }]}
    >
      <Text style={styles.navBack}>‹</Text>
      <Text style={styles.navTitle}>{title}</Text>
      <Text style={styles.navAction}>⋯</Text>
    </LiquidGlassView>
  );
}

const styles = StyleSheet.create({
  navBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 96,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 12,
    zIndex: 10,
  },
  navBack: { color: '#fff', fontSize: 28, fontWeight: '300' },
  navTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  navAction: { color: '#fff', fontSize: 22 },
});
```
{% endraw %}

## Glass card over a photo

A frosted card floating over a full-bleed image. Children (title, body, button)
render crisply on top; only the photo behind the card is blurred and refracted.

{% raw %}
```tsx
import { View, Text, Image, StyleSheet } from 'react-native';
import { LiquidGlassView } from 'react-native-liquid-glassmorphism';

function GlassCard() {
  return (
    <View style={styles.wrap}>
      <Image source={{ uri: 'https://picsum.photos/800/1200' }} style={StyleSheet.absoluteFill} />
      <LiquidGlassView variant="regular" borderRadius={24} style={styles.card}>
        <Text style={styles.cardTitle}>Liquid Glass</Text>
        <Text style={styles.cardBody}>
          Real refraction on iOS and Android — not just a blur.
        </Text>
        <LiquidGlassView
          tintColor="rgba(10,132,255,0.55)"
          interactive
          borderRadius={16}
          style={styles.cardButton}
        >
          <Text style={styles.cardButtonText}>Learn more</Text>
        </LiquidGlassView>
      </LiquidGlassView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { width: 300, padding: 22, gap: 12, overflow: 'hidden' },
  cardTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  cardBody: { color: 'rgba(255,255,255,0.9)', fontSize: 14, lineHeight: 20 },
  cardButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 4,
    overflow: 'hidden',
  },
  cardButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
```
{% endraw %}

## Media controls over video (`variant="clear"`)

For media, use the lighter `clear` variant so the video stays vivid behind the
transport bar. Circle shapes make crisp glass buttons.

{% raw %}
```tsx
import { View, Text, StyleSheet } from 'react-native';
import { LiquidGlassView } from 'react-native-liquid-glassmorphism';

function MediaControls() {
  return (
    <LiquidGlassView variant="clear" borderRadius={28} style={styles.bar}>
      <View style={styles.row}>
        {['⏮', '⏯', '⏭'].map((glyph) => (
          <LiquidGlassView
            key={glyph}
            variant="clear"
            interactive
            shape={{ type: 'circle' }}
            style={styles.button}
          >
            <Text style={styles.glyph}>{glyph}</Text>
          </LiquidGlassView>
        ))}
      </View>
    </LiquidGlassView>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', gap: 18 },
  button: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  glyph: { color: '#fff', fontSize: 22 },
});
```
{% endraw %}

## Notched glass tab bar (arbitrary SVG `path`)

A **concave** tab bar with a center scoop that cradles a floating action button —
impossible with `borderRadius`, but a single arbitrary SVG `path`. The glass
lenses the backdrop *around* the notch, so it's a true optical silhouette rather
than a clip. Size the view to the same view-box the path is authored in so it
isn't distorted.

{% raw %}
```tsx
import { Dimensions, View, Text, StyleSheet } from 'react-native';
import { LiquidGlassView } from 'react-native-liquid-glassmorphism';

const DOCK_W = Dimensions.get('window').width;
const DOCK_H = 82;
const FAB = 64;

// A curved bar with a center dip authored in a DOCK_W × DOCK_H view-box.
function notchPath(width: number): string {
  const center = width / 2;
  const half = Math.round(FAB * 0.83) / 2; // notch half-width
  const dip = Math.round(FAB * 0.62); // notch depth
  const sh = Math.round(FAB * 0.5); // shoulder
  const cp1 = Math.round(FAB * 0.11);
  const cp2 = Math.round(FAB * 0.25);
  const l = center - half;
  const r = center + half;
  return `
    M 0 0
    L ${l - sh} 0
    C ${l - cp1} 0, ${l - cp2} ${dip}, ${center} ${dip}
    C ${r + cp2} ${dip}, ${r + cp1} 0, ${r + sh} 0
    L ${width} 0
    L ${width} ${DOCK_H}
    L 0 ${DOCK_H}
    Z
  `.trim();
}

function GlassTabBar() {
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      {/* Floating action button, centered in the notch. */}
      <LiquidGlassView
        variant="clear"
        interactive
        tintColor="rgba(10,132,255,0.5)"
        shape={{ type: 'circle' }}
        style={styles.fab}
      >
        <Text style={styles.fabGlyph}>＋</Text>
      </LiquidGlassView>

      <LiquidGlassView
        variant="clear"
        shape={{ type: 'path', d: notchPath(DOCK_W), width: DOCK_W, height: DOCK_H }}
        style={styles.dock}
      >
        <View style={styles.row}>
          {['⌂', '◔', '◈', '⚙︎'].map((glyph, i) => (
            <Text key={i} style={styles.tab}>{glyph}</Text>
          ))}
        </View>
      </LiquidGlassView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center' },
  dock: { width: DOCK_W, height: DOCK_H },
  row: {
    flexDirection: 'row',
    height: DOCK_H,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
  },
  tab: { fontSize: 23, color: 'rgba(255,255,255,0.9)' },
  fab: {
    position: 'absolute',
    top: -FAB / 2 + 6,
    zIndex: 2,
    width: FAB,
    height: FAB,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabGlyph: { fontSize: 30, color: '#fff', fontWeight: '300' },
});
```
{% endraw %}

## Tinted glass buttons

A quick row of glass buttons — `tintColor` (with an `rgba()` alpha to control
strength) plus `interactive` for the touch bloom and tilt specular.

{% raw %}
```tsx
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LiquidGlassView } from 'react-native-liquid-glassmorphism';

function GlassButtons() {
  return (
    <View style={styles.row}>
      <Pressable>
        <LiquidGlassView tintColor="rgba(10,132,255,0.55)" interactive borderRadius={26} style={styles.btn}>
          <Text style={styles.btnText}>Get started</Text>
        </LiquidGlassView>
      </Pressable>
      <Pressable>
        <LiquidGlassView interactive borderRadius={26} style={styles.btn}>
          <Text style={styles.btnText}>Learn more</Text>
        </LiquidGlassView>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  btn: { paddingHorizontal: 26, paddingVertical: 16, overflow: 'hidden' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
```
{% endraw %}

---

Want more? The [`example/`]({{ site.repo_url }}/tree/main/example) app exercises
every variant, tint, shape, and the interactive touch/tilt response. See also the
[full API]({{ site.repo_url }}#api--liquidglassview) and [Custom shapes]({{ site.repo_url }}#custom-shapes).
