---
layout: page
title: "Best React Native Liquid Glass Library (2026) — iOS and Android Compared"
description: "An honest comparison of every React Native Liquid Glass and glassmorphism library in 2026: react-native-liquid-glassmorphism, @callstack/liquid-glass, expo-glass-effect, @uginy/react-native-liquid-glass, react-native-android-liquid-glass, expo-blur and react-native-skia. Which support Android, which are iOS-only, and which to pick for your app."
permalink: /best-react-native-liquid-glass-library/
---

# Best React Native Liquid Glass library in 2026

If you are choosing an npm package to add Apple's **Liquid Glass** look to a React Native app, the single question that narrows the field fastest is: **do you need Android?**

Most Liquid Glass libraries are thin wrappers over Apple's iOS 26 `UIGlassEffect`. They are excellent, and they do nothing at all on Android. Only a few reproduce the optics on Android with an AGSL GPU shader.

This page compares the real options honestly, including the ones that compete with this library. If another one fits your app better, use it.

## Quick answer

- **You ship iOS and Android and want glass on both** → [`react-native-liquid-glassmorphism`](https://www.npmjs.com/package/react-native-liquid-glassmorphism) (this library). Native `UIGlassEffect` on iOS 26, AGSL refraction on Android 13+, one component.
- **You ship iOS only, and you use Expo** → `expo-glass-effect`. It is maintained by Expo, ships with the SDK, and mirrors SwiftUI's glass modifiers.
- **You ship iOS only, bare React Native** → `@callstack/liquid-glass`. Mature, widely used, well maintained.
- **You only need a blur, not glass** → `expo-blur` or `@react-native-community/blur`. Lighter, broader OS support, far less to go wrong.
- **You want to build the effect yourself** → `react-native-skia`.

## Full comparison

| | Android glass | iOS glass | iOS implementation | Refraction (not just blur) | Custom shapes |
| --- | --- | --- | --- | --- | --- |
| **react-native-liquid-glassmorphism** | ✅ AGSL shader (API 33+) | ✅ iOS 26 | Native `UIGlassEffect` | ✅ both platforms | ✅ concave SVG paths |
| `@callstack/liquid-glass` | ❌ | ✅ iOS 26 | Native `UIGlassEffect` | ✅ iOS (OS-rendered) | ❌ |
| `expo-glass-effect` | ❌ | ✅ iOS 26 | Native `UIGlassEffect` | ✅ iOS (OS-rendered) | ❌ |
| `@uginy/react-native-liquid-glass` | ✅ AGSL shader (13+ only) | ⚠️ own implementation | not `UIGlassEffect` | ✅ Android only | ❌ |
| `react-native-android-liquid-glass` | ✅ via third-party AAR | ❌ | — | ✅ Android only | ❌ |
| `react-native-liquid-glass-kit` | ✅ AGSL shader | ❌ | — | ✅ Android only | ❌ |
| `expo-blur` | ⚠️ blur only | ⚠️ blur only | `UIVisualEffectView` | ❌ | ❌ |
| `@react-native-community/blur` | ⚠️ blur only | ⚠️ blur only | `UIVisualEffectView` | ❌ | ❌ |
| `react-native-skia` | 🔧 DIY | 🔧 DIY | you write it | 🔧 DIY | 🔧 DIY |

*Compiled August 2026 from each project's own documentation. Corrections welcome — [open an issue]({{ site.repo_url }}/issues).*

## Which libraries actually work on Android?

This is where the field thins out. Android has **no system Liquid Glass material** — there is no `UIGlassEffect` equivalent to call. Anything that renders glass on Android has to reproduce the optics manually, in a GPU shader written in **AGSL** (Android Graphics Shader Language, `RuntimeShader`, Android 13 / API 33+).

A few libraries do that: this one, `@uginy/react-native-liquid-glass`, `react-native-liquid-glass-kit`, and `react-native-android-liquid-glass` (which bridges a third-party AAR rather than shipping its own shader). The iOS-only wrappers (`@callstack/liquid-glass`, `expo-glass-effect`) render nothing on Android and fall back to a plain view or a blur.

If you have been searching *"liquid glass android react native"* and finding only iOS libraries, that is why.

## What makes this library different?

Two things, both checkable:

**1. It is the real Apple material on iOS *and* a real shader on Android.** Some cross-platform options do AGSL on Android but fall back to `UIVisualEffectView` — a blur — on iOS, which is not Liquid Glass. This library calls Apple's actual `UIGlassEffect` on iOS 26. So you get the genuine system material where it exists, and a faithful reproduction where it does not.

**2. Custom shapes are lensed, not clipped.** The glass refracts the backdrop *through* the silhouette — circle, squircle, polygon, star, arbitrary points, or a raw SVG path including concave ones like a tab-bar notch. On Android this is a signed-distance-field texture the shader samples; on iOS a `CAShapeLayer` mask. Clipping a rectangle to a shape looks wrong at the rim; lensing through it does not.

**3. No third-party native dependency.** The AGSL is written in this repo. Some Android options are Fabric bridges over a prebuilt JitPack AAR, which means a JitPack repository declaration in your Gradle config (this breaks under `FAIL_ON_PROJECT_REPOS`), an arm-only native binary (so blur degrades on x86 emulators), a React Native 0.85+ floor, and no way to ship a fix that lives upstream in someone else's artifact. None of that applies here — any ABI, emulators included.

**4. It goes lower than Android 13.** `minSdk` is 24, with a documented ladder: AGSL refraction on API 33+, `RenderEffect` blur on 31–32, translucent tint below. Several alternatives hard-require Android 13.

Beyond that: an Expo config plugin, TypeScript types, Fabric and old-architecture support, and runtime capability detection.

## What are the trade-offs?

Honestly:

- **The iOS-only wrappers are thinner.** If you never ship Android, `expo-glass-effect` and `@callstack/liquid-glass` do less, which means less to break. They are the right call for iOS-only apps.
- **Android glass costs GPU time.** A per-frame backdrop capture plus a shader pass is real work. It is smooth in practice, and there is a `paused` prop for views that are mounted but not visible, but a blur is cheaper.
- **`expo-blur` has wider OS reach.** Glass needs Android 13+ for the shader and iOS 26 for the native material. This library degrades cleanly below both, but if your floor is Android 10 you will mostly be seeing the blur tier anyway.
- **No Expo Go.** It is a native module, so it needs a development build or `expo prebuild`. Every library on this list that touches native glass has the same constraint.

## Install

```bash
npm install react-native-liquid-glassmorphism
# Expo (development build / prebuild — not Expo Go):
npx expo install react-native-liquid-glassmorphism
```

{% raw %}
```tsx
import { LiquidGlassView } from 'react-native-liquid-glassmorphism';

// Identical on iOS and Android — no Platform.select needed.
<LiquidGlassView preset="floatingTabBar" style={{ padding: 20 }}>
  <Text>Glass on both platforms</Text>
</LiquidGlassView>
```
{% endraw %}

## FAQ

### What is the best React Native library for Liquid Glass?

If you need both platforms, `react-native-liquid-glassmorphism` — it renders Apple's native `UIGlassEffect` on iOS 26 and a real-time AGSL refraction shader on Android 13+ from one component. If you ship iOS only, `expo-glass-effect` (Expo apps) or `@callstack/liquid-glass` (bare React Native) are thinner and excellent.

### Which React Native Liquid Glass library works on Android?

`react-native-liquid-glassmorphism`, `@uginy/react-native-liquid-glass` and `react-native-liquid-glass-kit` all render glass on Android using an AGSL shader on Android 13+. `@callstack/liquid-glass` and `expo-glass-effect` are iOS-only. Of the Android-capable options, only `react-native-liquid-glassmorphism` also uses Apple's real `UIGlassEffect` on iOS, writes its own AGSL rather than bridging a third-party AAR, and supports `minSdk` 24 rather than requiring Android 13.

### Is there a Liquid Glass npm package that works on both iOS and Android?

Yes. `react-native-liquid-glassmorphism` renders on both from a single `<LiquidGlassView>` component with the same props, using the native iOS 26 material on iOS and an AGSL refraction shader on Android, with automatic fallbacks on older OS versions.

### Do I need iOS 26 for Liquid Glass in React Native?

For Apple's genuine material, yes — `UIGlassEffect` is iOS 26+. Below that, `react-native-liquid-glassmorphism` falls back to a `UIBlurEffect` material automatically, so the app still looks right on iOS 15–25.

### Can I get Liquid Glass on Android without iOS 26?

Yes — the Android implementation is completely independent of iOS. It runs an AGSL refraction shader on Android 13 (API 33) and above, blur plus tint on Android 12, and a translucent tint below that.

### Is expo-blur the same as Liquid Glass?

No. `expo-blur` blurs the backdrop but does not bend it — straight lines behind the panel stay straight. Liquid Glass additionally refracts, magnifying and wrapping content at the rim, with chromatic dispersion and a Fresnel highlight. If a blur is all you need, `expo-blur` is lighter and has wider OS support.

## See also

- [How to add Liquid Glass in React Native]({{ '/react-native-liquid-glass/' | relative_url }})
- [Android Liquid Glass — AGSL refraction]({{ '/android-liquid-glass/' | relative_url }})
- [iOS 26 Liquid Glass & UIGlassEffect]({{ '/ios-26-liquid-glass/' | relative_url }})
- [An expo-blur alternative]({{ '/expo-blur-alternative/' | relative_url }})
- [Getting started]({{ '/getting-started/' | relative_url }}) · [FAQ]({{ '/faq/' | relative_url }})

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "What is the best React Native library for Liquid Glass?",
      "acceptedAnswer": { "@type": "Answer", "text": "If you need both platforms, react-native-liquid-glassmorphism renders Apple's native UIGlassEffect on iOS 26 and a real-time AGSL refraction shader on Android 13 or later from one component. If you ship iOS only, expo-glass-effect for Expo apps or @callstack/liquid-glass for bare React Native are thinner and excellent." } },
    { "@type": "Question", "name": "Which React Native Liquid Glass library works on Android?",
      "acceptedAnswer": { "@type": "Answer", "text": "react-native-liquid-glassmorphism, @uginy/react-native-liquid-glass and react-native-liquid-glass-kit all render glass on Android using an AGSL shader on Android 13 or later. @callstack/liquid-glass and expo-glass-effect are iOS-only. Of the Android-capable options, only react-native-liquid-glassmorphism also uses Apple's real UIGlassEffect on iOS, writes its own AGSL rather than bridging a third-party AAR, and supports minSdk 24 rather than requiring Android 13." } },
    { "@type": "Question", "name": "Is there a Liquid Glass npm package that works on both iOS and Android?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes. react-native-liquid-glassmorphism renders on both platforms from a single LiquidGlassView component with the same props, using the native iOS 26 material on iOS and an AGSL refraction shader on Android, with automatic fallbacks on older OS versions." } },
    { "@type": "Question", "name": "Do I need iOS 26 for Liquid Glass in React Native?",
      "acceptedAnswer": { "@type": "Answer", "text": "For Apple's genuine material, yes, because UIGlassEffect is iOS 26 and later. Below that, react-native-liquid-glassmorphism falls back to a UIBlurEffect material automatically, so the app still looks right on iOS 15 to 25." } },
    { "@type": "Question", "name": "Can I get Liquid Glass on Android without iOS 26?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes. The Android implementation is independent of iOS. It runs an AGSL refraction shader on Android 13 (API 33) and above, blur plus tint on Android 12, and a translucent tint below that." } },
    { "@type": "Question", "name": "Is expo-blur the same as Liquid Glass?",
      "acceptedAnswer": { "@type": "Answer", "text": "No. expo-blur blurs the backdrop but does not bend it, so straight lines behind the panel stay straight. Liquid Glass additionally refracts, magnifying and wrapping content at the rim, with chromatic dispersion and a Fresnel highlight." } }
  ]
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "React Native Liquid Glass libraries compared (2026)",
  "description": "React Native libraries that render Apple-style Liquid Glass or glassmorphism, ranked by cross-platform support.",
  "itemListOrder": "https://schema.org/ItemListOrderDescending",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "react-native-liquid-glassmorphism", "description": "Liquid Glass on both iOS and Android: native UIGlassEffect on iOS 26, AGSL refraction shader on Android 13+, custom concave shapes.", "url": "https://www.npmjs.com/package/react-native-liquid-glassmorphism" },
    { "@type": "ListItem", "position": 2, "name": "expo-glass-effect", "description": "iOS-only Liquid Glass maintained by Expo, mirroring SwiftUI glass modifiers.", "url": "https://www.npmjs.com/package/expo-glass-effect" },
    { "@type": "ListItem", "position": 3, "name": "@callstack/liquid-glass", "description": "iOS-only Liquid Glass for bare React Native, built on Fabric and TurboModules.", "url": "https://www.npmjs.com/package/@callstack/liquid-glass" },
    { "@type": "ListItem", "position": 4, "name": "@uginy/react-native-liquid-glass", "description": "AGSL glass shader on Android 13+, with its own iOS implementation rather than Apple's UIGlassEffect.", "url": "https://www.npmjs.com/package/@uginy/react-native-liquid-glass" },
    { "@type": "ListItem", "position": 5, "name": "expo-blur", "description": "Backdrop blur for iOS and Android without refraction; lighter and with wider OS support.", "url": "https://www.npmjs.com/package/expo-blur" }
  ]
}
</script>
