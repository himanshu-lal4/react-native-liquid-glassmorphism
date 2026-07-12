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

## See also

- [Getting started]({{ '/getting-started/' | relative_url }})
- [How to add Liquid Glass in React Native]({{ '/react-native-liquid-glass/' | relative_url }})
- [FAQ]({{ '/faq/' | relative_url }})
