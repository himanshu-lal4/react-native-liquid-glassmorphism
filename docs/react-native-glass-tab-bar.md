---
layout: page
title: "Liquid Glass Tab Bar"
description: "Build an iOS 26-style Liquid Glass bottom tab bar in React Native that also works on Android, wired up with React Navigation or Expo Router."
permalink: /react-native-glass-tab-bar/
---

# Liquid Glass tab bar in React Native

The floating, translucent tab bar is the signature Liquid Glass component — and the one people most often find is iOS-only. This works on **Android too**: the same `<LiquidGlassView>` renders Apple's native `UIGlassEffect` on iOS 26 and an AGSL refraction shader on Android 13+.

The `floatingTabBar` preset is tuned for exactly this: full thickness and a live rim, so the bar reads as a physical object sitting above the page.

## A floating glass tab bar

{% raw %}
```tsx
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LiquidGlassView } from 'react-native-liquid-glassmorphism';

export function GlassTabBar({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();

  return (
    <LiquidGlassView
      preset="floatingTabBar"
      interactive
      style={[styles.bar, { bottom: insets.bottom + 12 }]}
    >
      <View style={styles.row}>{children}</View>
    </LiquidGlassView>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 64,
    overflow: 'hidden',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
});
```
{% endraw %}

`interactive` gives you the touch-driven specular bloom on both platforms. Leave `tilt` off here — it registers a motion sensor for as long as the bar is mounted, and persistent chrome is exactly where that costs battery.

## Wiring it into React Navigation

Bottom tabs accept a `tabBarBackground` render prop, which is the clean insertion point — the glass sits behind the real tab bar, so you keep all the navigation behaviour.

{% raw %}
```tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LiquidGlassView } from 'react-native-liquid-glassmorphism';
import { StyleSheet } from 'react-native';

const Tab = createBottomTabNavigator();

<Tab.Navigator
  screenOptions={{
    // The bar must be transparent so the glass behind it shows through.
    tabBarStyle: {
      position: 'absolute',
      backgroundColor: 'transparent',
      borderTopWidth: 0,
      elevation: 0,
    },
    tabBarBackground: () => (
      <LiquidGlassView
        preset="navigationBar"
        style={StyleSheet.absoluteFill}
      />
    ),
  }}
>
  {/* screens */}
</Tab.Navigator>
```
{% endraw %}

Two details matter: set `position: 'absolute'` so content scrolls *under* the bar (otherwise there is nothing behind the glass to refract), and clear `backgroundColor`, `borderTopWidth` and `elevation` — Android's default elevation shadow will otherwise draw a hairline over the glass.

Use `preset="navigationBar"` for a pinned, edge-to-edge bar: square corners and a shallow lens, because a deep lens across a full-width bar just smears the content behind it.

## Expo Router

Expo Router's `Tabs` passes options straight through to React Navigation, so the same approach applies:

{% raw %}
```tsx
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { LiquidGlassView } from 'react-native-liquid-glassmorphism';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarBackground: () => (
          <LiquidGlassView preset="navigationBar" style={StyleSheet.absoluteFill} />
        ),
      }}
    />
  );
}
```
{% endraw %}

This needs a development build or `expo prebuild` — glass is a native module and cannot run in Expo Go.

## A notched (concave) tab bar

Because the glass is lensed through a silhouette rather than clipped to one, concave shapes work — including the classic cut-out for a centre action button.

{% raw %}
```tsx
const W = 360;
const H = 64;

// A rounded bar with a semicircular notch cut out of the top centre,
// drawn with cubic béziers (elliptic arcs are not supported).
const notch = `
  M 16 0 H 148
  C 158 0 158 30 180 30
  C 202 30 202 0 212 0
  H 344 C 353 0 360 7 360 16
  V 48 C 360 57 353 64 344 64
  H 16 C 7 64 0 57 0 48
  V 16 C 0 7 7 0 16 0 Z
`;

<LiquidGlassView
  preset="floatingTabBar"
  shape={{ type: 'path', d: notch, width: W, height: H }}
  style={{ width: W, height: H }}
/>
```
{% endraw %}

`width` and `height` in the shape describe the coordinate space the `d` string was authored in — not the on-screen size. Keep the view's aspect ratio matched to them or the silhouette will stretch. On Android this becomes a signed-distance-field texture the shader samples (API 33+); on iOS it becomes a `CAShapeLayer` mask.

## Keeping icons readable

Over a busy feed, a `clear` tab bar can swallow its own icons. On Android, `legibilityFloor` adds an adaptive veil **under the children only**, so the icons stay readable without darkening the whole bar:

{% raw %}
```tsx
<LiquidGlassView
  variant="clear"
  legibilityFloor={0.4}
  edgeReflectionStrength={0.4}   // calm the mirrored rim echo behind labels
  borderRadius={28}
  style={styles.bar}
>
  {icons}
</LiquidGlassView>
```
{% endraw %}

On iOS, `variant="regular"` already adapts for legibility, or add a `tintColor` with alpha.

## Performance on a persistent bar

A tab bar is mounted for the entire session, so it is the one glass view worth tuning:

- Leave `tilt` off — the motion sensor runs for as long as the view lives.
- Do not stack it over another glass surface; each layer is another capture and shader pass.
- Set `paused` on any *other* glass views on inactive screens. Android already pauses views it knows are off-screen, but a screen kept alive in a navigator stack is a case it cannot see.

## FAQ

### How do I make a Liquid Glass tab bar in React Native?

Render a `<LiquidGlassView preset="floatingTabBar">` as an absolutely-positioned bar, or pass one as React Navigation's `tabBarBackground` with a transparent `tabBarStyle`. It renders Apple's native `UIGlassEffect` on iOS 26 and an AGSL refraction shader on Android 13+.

### Can I get an iOS 26-style glass tab bar on Android?

Yes. `react-native-liquid-glassmorphism` reproduces the Liquid Glass optics on Android 13 and later with an AGSL shader, so the same tab bar component renders glass on both platforms without any `Platform.select`.

### Why is my glass tab bar not showing the blur?

Usually the tab bar is not transparent or content is not scrolling underneath it. Set `tabBarStyle` to `position: 'absolute'` with `backgroundColor: 'transparent'`, `borderTopWidth: 0` and `elevation: 0`. Glass treats the backdrop, so if nothing passes behind the bar there is nothing to blur or refract.

### Can a Liquid Glass tab bar have a notch or cut-out?

Yes. Pass a `shape` of `{ type: 'path', d, width, height }` with a concave SVG path. The backdrop is lensed through the silhouette rather than clipped to it. Elliptic arcs (`A`) are not supported — use cubic or quadratic béziers.

### Does a glass tab bar work with Expo Router?

Yes, with a development build or `expo prebuild`. Expo Router passes `screenOptions` straight through to React Navigation, so the `tabBarBackground` approach works unchanged. It cannot run in Expo Go.

## See also

- [Recipes]({{ '/recipes/' | relative_url }}) · [API reference]({{ '/api/' | relative_url }}) · [Presets]({{ '/api/#presets' | relative_url }})
- [Android Liquid Glass]({{ '/android-liquid-glass/' | relative_url }}) · [iOS 26 Liquid Glass]({{ '/ios-26-liquid-glass/' | relative_url }})
- [Expo setup]({{ '/expo-liquid-glass/' | relative_url }}) · [Troubleshooting]({{ '/troubleshooting/' | relative_url }})

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "How do I make a Liquid Glass tab bar in React Native?",
      "acceptedAnswer": { "@type": "Answer", "text": "Render a LiquidGlassView with the floatingTabBar preset as an absolutely-positioned bar, or pass one as React Navigation's tabBarBackground with a transparent tabBarStyle. It renders Apple's native UIGlassEffect on iOS 26 and an AGSL refraction shader on Android 13 and later." } },
    { "@type": "Question", "name": "Can I get an iOS 26-style glass tab bar on Android?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes. react-native-liquid-glassmorphism reproduces the Liquid Glass optics on Android 13 and later with an AGSL shader, so the same tab bar component renders glass on both platforms without any Platform.select." } },
    { "@type": "Question", "name": "Why is my glass tab bar not showing the blur?",
      "acceptedAnswer": { "@type": "Answer", "text": "Usually the tab bar is not transparent, or content is not scrolling underneath it. Set tabBarStyle to position absolute with a transparent backgroundColor, borderTopWidth 0 and elevation 0. Glass treats the backdrop, so if nothing passes behind the bar there is nothing to blur or refract." } },
    { "@type": "Question", "name": "Can a Liquid Glass tab bar have a notch or cut-out?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes. Pass a shape of type path with a concave SVG path. The backdrop is lensed through the silhouette rather than clipped to it. Elliptic arcs are not supported, so use cubic or quadratic beziers." } },
    { "@type": "Question", "name": "Does a Liquid Glass tab bar work with Expo Router?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes, with a development build or expo prebuild. Expo Router passes screenOptions straight through to React Navigation, so the tabBarBackground approach works unchanged. It cannot run in Expo Go." } }
  ]
}
</script>
