---
layout: page
title: "React Native Glassmorphism — Frosted Glass vs Real Liquid Glass"
description: "How to build glassmorphism and frosted-glass UI in React Native, and how CSS-style glassmorphism (blur + translucency) differs from true Liquid Glass, which refracts the backdrop through a modelled lens on both iOS and Android."
permalink: /react-native-glassmorphism/
---

# React Native glassmorphism

**Glassmorphism** is the UI style where a panel looks like frosted glass: the content behind it is blurred, the surface is translucent and lightly tinted, and a thin bright border traces the edge. On the web it's three CSS declarations. In React Native there is no `backdrop-filter`, so it takes a native view — and once you're already going native, you can do considerably better than a blur.

```bash
npm install react-native-liquid-glassmorphism
# yarn add react-native-liquid-glassmorphism
# Expo (dev build / prebuild — not Expo Go):
npx expo install react-native-liquid-glassmorphism
```

## What is glassmorphism, and how is Liquid Glass different?

They are not the same effect, and the difference is optical, not stylistic.

**CSS-style glassmorphism** — `backdrop-filter: blur(12px)` plus `rgba()` background plus a `1px` light border — has three ingredients: blur, translucency, tint. The backdrop is *softened* and shows through, but its geometry is untouched. Straight lines behind the panel stay straight. It is a frosted pane.

**Liquid Glass** — Apple's iOS 26 material — adds the part that makes glass read as a physical object: **refraction**. Light bends as it passes through a curved medium, so content behind the rim is displaced and magnified, appearing to wrap around the edge. Alongside that come chromatic dispersion at the rim, a mirrored edge reflection, a Fresnel highlight, and a specular that tracks light. Straight lines behind the panel **bend** near its edges.

| | CSS-style glassmorphism | Liquid Glass |
| --- | --- | --- |
| Backdrop blurred | ✅ | ✅ (deliberately lighter) |
| Translucent + tinted | ✅ | ✅ |
| Backdrop **geometry** bent (refraction) | ❌ | ✅ |
| Content magnified/wrapped at the rim | ❌ | ✅ |
| Chromatic dispersion | ❌ | ✅ (subtle) |
| Mirrored edge reflection | ❌ | ✅ |
| Fresnel rim + moving specular | ❌ (static border) | ✅ |
| Reacts to touch / device tilt | ❌ | ✅ |

A useful test: put a hard-edged photo behind the surface and look at its edges through the rim. If they stay perfectly straight, it's glassmorphism. If they curve, it's a lens.

Practically, this is also why Liquid Glass uses **less** blur, not more. Blur destroys the detail the lens needs to bend — this library's Android blur ramps only 3–12 dp, and the `clear` variant uses barely a fifth of that.

## How do I do glassmorphism in React Native?

`<LiquidGlassView>` is a drop-in view: wrap your content, and only the backdrop behind it is treated. Children render crisply on top.

```tsx
import { View, Image, Text, StyleSheet } from 'react-native';
import { LiquidGlassView } from 'react-native-liquid-glassmorphism';

export function FrostedCard() {
  return (
    <View style={styles.wrap}>
      <Image
        source={{ uri: 'https://picsum.photos/800/1200' }}
        style={StyleSheet.absoluteFill}
      />
      <LiquidGlassView
        variant="regular"
        intensity={60}
        tintColor="rgba(255,255,255,0.12)"
        borderRadius={24}
        style={styles.card}
      >
        <Text style={styles.title}>Frosted glass</Text>
        <Text style={styles.body}>
          Blurred, tinted — and actually refracted at the rim.
        </Text>
      </LiquidGlassView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { width: 300, padding: 22, gap: 10, overflow: 'hidden' },
  title: { color: '#fff', fontSize: 22, fontWeight: '800' },
  body: { color: 'rgba(255,255,255,0.9)', fontSize: 14, lineHeight: 20 },
});
```

There's nothing else to configure. On iOS 26 this is Apple's native `UIGlassEffect`; on Android 13+ it's a real-time AGSL refraction shader; on older OS versions it steps down to a blur or translucent tint automatically.

## Can I get a plain frosted pane instead?

Yes — if you want classic glassmorphism rather than a lens, turn the lensing off on Android with `thickness={0}`. That leaves blur + tint + rim, which is exactly the CSS-style look:

```tsx
<LiquidGlassView
  variant="regular"
  intensity={80}
  thickness={0}          // Android: flat pane, no lensing
  tintColor="rgba(255,255,255,0.14)"
  borderRadius={20}
  style={styles.panel}
>
  {children}
</LiquidGlassView>
```

`thickness` is Android-only (iOS glass optics are fixed by the OS), so it's safe to set unconditionally.

For the opposite direction — a deeper, more obviously liquid lens — raise it toward `2`:

```tsx
<LiquidGlassView thickness={1.6} style={styles.panel}>{children}</LiquidGlassView>
```

## Which variant should I use?

- **`variant="regular"`** — adaptive frosted glass. The material lightens dark backdrops so foreground text stays legible. Use for nav bars, cards, sheets, and general chrome. This is the default.
- **`variant="clear"`** — lighter, largely transparent refractive glass with very little frost. Use over photos and video where you want the media to stay vivid.

`clear` faithfully transmits whatever is behind it, which can make icons and labels hard to read over busy content. On Android, `legibilityFloor` adds an adaptive veil **under the children only** — so chrome stays readable without darkening the whole pane:

```tsx
<LiquidGlassView
  variant="clear"
  legibilityFloor={0.4}
  tintColor="rgba(10,9,8,0.5)"
  edgeReflectionStrength={0.4}   // calm the rim echo over text
  style={styles.tabBar}
>
  {/* icons + labels stay readable */}
</LiquidGlassView>
```

## Can glassmorphism panels be non-rectangular?

Yes, and this is where a real optical model pays off: the glass **lenses the backdrop through the silhouette**, rather than clipping a rectangle to a shape. Concave shapes work too.

```tsx
<LiquidGlassView shape={{ type: 'circle' }} style={{ width: 96, height: 96 }} />
<LiquidGlassView shape={{ type: 'squircle', n: 4 }} />
<LiquidGlassView shape={{ type: 'polygon', sides: 6, rotation: 15 }} />
<LiquidGlassView shape={{ type: 'star', points: 5, innerRatio: 0.5 }} />
<LiquidGlassView shape={{ type: 'points', points: [[0, 0], [1, 0], [0.5, 1]] }} />
```

The shape fills the view's bounds, so size the view to the shape's aspect ratio to avoid distortion. When `shape` is set, `borderRadius` is ignored. See the [notched tab bar recipe]({{ '/recipes/' | relative_url }}) for an arbitrary SVG path.

## Should I just use a semi-transparent View?

If you only need a scrim, yes — a plain `<View>` with an `rgba()` background is free and works everywhere. Reach for glass when the backdrop's *content* should remain perceptible through the surface: a nav bar over scrolling content, a card over a photo, media controls over video. That's what blur, and then refraction, actually buy you.

## FAQ

### How do I add glassmorphism to a React Native app?

Install `react-native-liquid-glassmorphism`, rebuild the native app (it's a native module, so use a dev build or `expo prebuild`, not Expo Go), and wrap content in `<LiquidGlassView>`. There's no `backdrop-filter` in React Native, so a native view is required either way.

### What's the difference between glassmorphism and Liquid Glass?

Glassmorphism is blur + translucency + tint: the backdrop is softened but its geometry is unchanged. Liquid Glass additionally **refracts** the backdrop — bending and magnifying content at the rim, with chromatic dispersion, a mirrored edge reflection, and a Fresnel highlight. Straight lines behind a glassmorphic panel stay straight; behind Liquid Glass they curve near the edges.

### Does React Native support `backdrop-filter` or CSS blur?

No. React Native has no `backdrop-filter`, and `filter: blur()` on a `View` blurs the view itself, not what's behind it. Backdrop treatment requires a native view — `UIVisualEffectView` on iOS, `RenderEffect` on Android.

### Can I control how frosted the glass looks?

Yes. `intensity` (0–100) scales the blur strength, `variant` picks frosted (`regular`) or near-transparent (`clear`), and `tintColor` layers a colour over the backdrop — use an `rgba()` or 8-digit hex to control tint strength. On Android, `thickness` scales the refraction depth, with `0` giving a flat non-lensing pane.

### Does it work on both iOS and Android?

Yes. iOS 26 renders Apple's native `UIGlassEffect`; Android 13 / API 33+ runs a real-time AGSL refraction shader. Older OS versions fall back automatically — `UIBlurEffect` on iOS 15–25, `RenderEffect` blur on Android 12, a translucent tint below that.

## See also

- [Getting started]({{ '/getting-started/' | relative_url }})
- [iOS 26 Liquid Glass & UIGlassEffect]({{ '/ios-26-liquid-glass/' | relative_url }})
- [Android Liquid Glass — AGSL refraction]({{ '/android-liquid-glass/' | relative_url }})
- [Expo Liquid Glass setup]({{ '/expo-liquid-glass/' | relative_url }})
- [An expo-blur alternative]({{ '/expo-blur-alternative/' | relative_url }})
- [Recipes]({{ '/recipes/' | relative_url }}) · [FAQ]({{ '/faq/' | relative_url }})
- [GitHub repo]({{ site.repo_url }}) · [npm]({{ site.npm_url }})

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "React Native Glassmorphism — LiquidGlassView",
  "alternateName": "react-native-liquid-glassmorphism",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "iOS, Android",
  "description": "Glassmorphism and frosted-glass surfaces for React Native from one declarative component, with real Liquid Glass refraction on top of the usual blur, translucency and tint: native UIGlassEffect on iOS 26 and an AGSL refractive-lens shader on Android 13+.",
  "programmingLanguage": ["TypeScript", "Objective-C++", "Kotlin"],
  "license": "https://opensource.org/licenses/MIT",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  "author": { "@type": "Person", "name": "Himanshu Lal", "url": "https://github.com/himanshu-lal4" },
  "downloadUrl": "https://www.npmjs.com/package/react-native-liquid-glassmorphism",
  "codeRepository": "https://github.com/himanshu-lal4/react-native-liquid-glassmorphism",
  "keywords": "react native glassmorphism, react native frosted glass, react native backdrop filter, glassmorphism vs liquid glass, react native glass effect, frosted glass card react native"
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "How do I add glassmorphism to a React Native app?",
      "acceptedAnswer": { "@type": "Answer", "text": "Install react-native-liquid-glassmorphism, rebuild the native app (it is a native module, so use a dev build or expo prebuild rather than Expo Go), and wrap content in a LiquidGlassView. React Native has no backdrop-filter, so a native view is required either way." } },
    { "@type": "Question", "name": "What is the difference between glassmorphism and Liquid Glass?",
      "acceptedAnswer": { "@type": "Answer", "text": "Glassmorphism is blur plus translucency plus tint: the backdrop is softened but its geometry is unchanged. Liquid Glass additionally refracts the backdrop, bending and magnifying content at the rim, with chromatic dispersion, a mirrored edge reflection and a Fresnel highlight. Straight lines behind a glassmorphic panel stay straight; behind Liquid Glass they curve near the edges." } },
    { "@type": "Question", "name": "Does React Native support backdrop-filter or CSS blur?",
      "acceptedAnswer": { "@type": "Answer", "text": "No. React Native has no backdrop-filter, and blurring a View blurs the view itself rather than what is behind it. Backdrop treatment requires a native view: UIVisualEffectView on iOS, RenderEffect on Android." } },
    { "@type": "Question", "name": "Can I control how frosted the glass looks?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes. The intensity prop (0 to 100) scales blur strength, variant picks frosted (regular) or near-transparent (clear), and tintColor layers a colour over the backdrop. On Android, thickness scales refraction depth, with 0 giving a flat non-lensing pane." } },
    { "@type": "Question", "name": "Does React Native glassmorphism work on both iOS and Android?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes. iOS 26 renders Apple's native UIGlassEffect and Android 13 / API 33 or later runs a real-time AGSL refraction shader. Older OS versions fall back automatically: UIBlurEffect on iOS 15 to 25, RenderEffect blur on Android 12, and a translucent tint below that." } }
  ]
}
</script>
