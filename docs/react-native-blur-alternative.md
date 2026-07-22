---
layout: page
title: "React Native Liquid Glass vs expo-blur, react-native-blur & expo-glass-effect"
description: "Comparing React Native glass/blur libraries: expo-blur, @react-native-community/blur, expo-glass-effect, @callstack/liquid-glass, and react-native-liquid-glassmorphism. Which give real Liquid Glass, refraction, and cross-platform (iOS + Android) support."
permalink: /react-native-blur-alternative/
---

# A react-native-blur / expo-blur alternative with real Liquid Glass

Most "glass" in React Native is really just **blur**: `expo-blur` and `@react-native-community/blur` blur the backdrop on both platforms, but there's no refraction, no edge lensing, and no interactive glass. The newer iOS-native options (`expo-glass-effect`, `@callstack/liquid-glass`) render Apple's real Liquid Glass — but only on **iOS 26**, leaving Android with nothing. `react-native-liquid-glassmorphism` is built for the gap: **authentic Liquid Glass on iOS *and* a matching real-time refraction shader on Android**, from one component.

## Comparison

| Capability | react-native-liquid-glassmorphism | expo-blur | @react-native-community/blur | expo-glass-effect / @callstack/liquid-glass |
|---|---|---|---|---|
| Native iOS 26 Liquid Glass (`UIGlassEffect`) | ✅ | ❌ (blur only) | ❌ (blur only) | ✅ |
| Liquid Glass optics on **Android** | ✅ AGSL refraction shader | ❌ blur only | ❌ blur only | ❌ iOS-only |
| Real refraction / edge lensing (not just blur) | ✅ | ❌ | ❌ | ✅ (iOS, OS-rendered) |
| Chromatic dispersion + Fresnel rim | ✅ (Android shader) | ❌ | ❌ | OS-managed (iOS) |
| Interactive (touch bloom + tilt specular) | ✅ | ❌ | ❌ | Partial (iOS interactive glass) |
| Custom shapes (concave SVG silhouette) | ✅ | ❌ | ❌ | ❌ |
| Graceful fallback on older OS | ✅ blur / tint | ✅ | ✅ | ⚠️ iOS 26 only |
| Expo config plugin | ✅ | ✅ | ❌ | ✅ |
| New Architecture (Fabric) | ✅ | ✅ | ⚠️ | ✅ |
| TypeScript | ✅ | ✅ | ✅ | ✅ |

> Feature matrices for other libraries move quickly — check each project's current docs before deciding. This table reflects the honest positioning as of 2026.

## When to pick which

- **expo-blur** — you only need a blurred backdrop (nav bar, modal scrim) on iOS and Android, and don't need refraction or an iOS-26 glass look. Simple and well-supported.
- **@react-native-community/blur** — a bare-workflow blur view if you're not on Expo.
- **expo-glass-effect / @callstack/liquid-glass** — you're **iOS-only** and want Apple's native Liquid Glass with the least code. No Android glass.
- **react-native-liquid-glassmorphism** — you want **real Liquid Glass on both iOS and Android** from one API: native `UIGlassEffect` on iOS 26, a real-time AGSL refraction shader on Android, interactive touch/tilt, and custom shapes — with clean fallbacks on older OS versions.

## Migrating from a blur view

The mental model is the same — wrap content in a view; the backdrop behind it is treated. Where a blur view only blurs, `LiquidGlassView` blurs **and** refracts, tints, and (optionally) reacts to touch/tilt:

```tsx
// Before — expo-blur
<BlurView intensity={60} tint="light" style={styles.card}>
  <Text>Content</Text>
</BlurView>

// After — react-native-liquid-glassmorphism
<LiquidGlassView variant="regular" intensity={60} interactive borderRadius={16} style={styles.card}>
  <Text>Content</Text>
</LiquidGlassView>
```

Children still render crisply on top; only the backdrop is affected.

## FAQ

### What's the best react-native-blur / expo-blur alternative for real glass?

If you only need a blurred backdrop, `expo-blur` and `@react-native-community/blur` are the right tools. If you want an actual glass material — refraction and edge lensing, not just blur — `react-native-liquid-glassmorphism` renders native `UIGlassEffect` on iOS 26 and a matching AGSL refraction shader on Android, which no blur library does.

### Does this work on Android, unlike the iOS-only glass libraries?

Yes. `expo-glass-effect` and `@callstack/liquid-glass` render Apple's real Liquid Glass but only on iOS 26, leaving Android with nothing. This library adds a real-time AGSL refraction shader on Android 13 (API 33+), so both platforms get glass from one component, with blur or tint fallbacks below those OS versions.

### Can I migrate from a BlurView without rewriting my UI?

Mostly, yes. The mental model is identical — wrap content, the backdrop behind it is treated, children render on top. Swap `<BlurView intensity tint>` for `<LiquidGlassView variant intensity tintColor>`; `intensity` keeps its 0–100 meaning but the two libraries scale it differently, so expect to retune. Standard `ViewProps` still work since the component extends them.

### Does it run in Expo Go?

No — it's a custom native module (`UIGlassEffect` on iOS, an AGSL `RuntimeShader` on Android), so it needs `expo prebuild` or a dev build. `expo-blur` runs in Expo Go, which is one reason many apps keep it for utility scrims and use Liquid Glass only for hero surfaces.

## See also

- [Getting started]({{ '/getting-started/' | relative_url }})
- [How to add Liquid Glass in React Native]({{ '/react-native-liquid-glass/' | relative_url }})
- [An expo-blur alternative — honest comparison]({{ '/expo-blur-alternative/' | relative_url }})
- [Android Liquid Glass — AGSL refraction shader]({{ '/android-liquid-glass/' | relative_url }})
- [FAQ]({{ '/faq/' | relative_url }})

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "React Native Liquid Glass — a react-native-blur alternative",
  "alternateName": "react-native-liquid-glassmorphism",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "iOS, Android",
  "description": "An alternative to expo-blur, @react-native-community/blur, expo-glass-effect and @callstack/liquid-glass for React Native apps that need a real glass material rather than a flat blur: native UIGlassEffect on iOS 26 and an AGSL refraction shader on Android 13+, with real refraction, chromatic dispersion, a Fresnel rim, interactive touch/tilt, and custom shapes across both platforms.",
  "programmingLanguage": ["TypeScript", "Objective-C++", "Kotlin"],
  "license": "https://opensource.org/licenses/MIT",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  "author": { "@type": "Person", "name": "Himanshu Lal", "url": "https://github.com/himanshu-lal4" },
  "downloadUrl": "https://www.npmjs.com/package/react-native-liquid-glassmorphism",
  "codeRepository": "https://github.com/himanshu-lal4/react-native-liquid-glassmorphism",
  "keywords": "react native blur alternative, react-native-community blur alternative, expo-blur alternative, expo-glass-effect alternative, react native liquid glass, blurview replacement"
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "What's the best react-native-blur / expo-blur alternative for real glass?",
      "acceptedAnswer": { "@type": "Answer", "text": "If you only need a blurred backdrop, expo-blur and @react-native-community/blur are the right tools. If you want an actual glass material — refraction and edge lensing, not just blur — react-native-liquid-glassmorphism renders native UIGlassEffect on iOS 26 and a matching AGSL refraction shader on Android, which no blur library does." } },
    { "@type": "Question", "name": "Does this work on Android, unlike the iOS-only glass libraries?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes. expo-glass-effect and @callstack/liquid-glass render Apple's real Liquid Glass but only on iOS 26, leaving Android with nothing. This library adds a real-time AGSL refraction shader on Android 13 (API 33+), so both platforms get glass from one component, with blur or tint fallbacks below those OS versions." } },
    { "@type": "Question", "name": "Can I migrate from a BlurView without rewriting my UI?",
      "acceptedAnswer": { "@type": "Answer", "text": "Mostly, yes. The mental model is identical — wrap content, the backdrop behind it is treated, children render on top. Swap BlurView with intensity and tint for LiquidGlassView with variant, intensity and tintColor; intensity keeps its 0 to 100 meaning but the two libraries scale it differently, so expect to retune. Standard ViewProps still work since the component extends them." } },
    { "@type": "Question", "name": "Does it run in Expo Go?",
      "acceptedAnswer": { "@type": "Answer", "text": "No. It is a custom native module using UIGlassEffect on iOS and an AGSL RuntimeShader on Android, so it needs expo prebuild or a dev build. expo-blur runs in Expo Go, which is one reason many apps keep it for utility scrims and use Liquid Glass only for hero surfaces." } }
  ]
}
</script>
