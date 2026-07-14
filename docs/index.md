---
layout: home
title: "React Native Liquid Glass — iOS 26 UIGlassEffect + Android Glass Refraction"
description: "React Native library for authentic Liquid Glass on iOS and Android from one component. Native UIGlassEffect on iOS 26, real-time AGSL refraction on Android, custom shapes, interactive touch/tilt, Expo config plugin, TypeScript, New Architecture ready."
---

# React Native Liquid Glass

**The way to add authentic Liquid Glass to a React Native app — on both iOS *and* Android — from a single declarative component.** On iOS 26 it renders Apple's native `UIGlassEffect`. On Android, where there is no system Liquid Glass, it reproduces the same optics in a real-time **AGSL refractive-lens shader** — capturing the backdrop and bending it through a rounded-glass lozenge with edge refraction, chromatic dispersion, a mirrored edge reflection, a Fresnel rim, and tilt/touch specular highlights. Ships an **Expo config plugin**, first-class **TypeScript** types, custom **shapes** (including concave SVG silhouettes), and works on the **New Architecture (Fabric)** and the old one.

```bash
npm install react-native-liquid-glassmorphism
# Expo (dev build / prebuild — not Expo Go):
npx expo install react-native-liquid-glassmorphism
```

```tsx
import { LiquidGlassView } from 'react-native-liquid-glassmorphism';

<LiquidGlassView variant="regular" tintColor="rgba(10,132,255,0.5)" interactive borderRadius={24}>
  <Text>Frosted glass content</Text>
</LiquidGlassView>
```

## Why choose it

- **Real Liquid Glass on both platforms** — native `UIGlassEffect` on iOS 26, a matching AGSL refraction shader on Android. Most alternatives are iOS-only or plain blur.
- **Actual refraction, not just blur** — Android bends and magnifies the backdrop through a glass lozenge (edge refraction + chromatic dispersion + mirrored edge reflection + Fresnel rim), instead of a flat frosted pane.
- **Interactive glass** — reacts to touch (a specular bloom + optical magnification under the finger) and to device tilt (a moving specular highlight).
- **Custom shapes** — `circle`, `squircle`, `polygon`, explicit `points`, or an arbitrary (even **concave**) SVG `path`. The glass *lenses the backdrop through the shape* — a real optical silhouette, not a clip.
- **Graceful degradation** — full effect on iOS 26 / Android 13 (API 33+); clean blur or translucent fallbacks on older OS versions.
- **Drop-in** — one declarative component, identical API across platforms, Expo config plugin, New Architecture + old architecture, TypeScript.

## Quick links

- [Getting started]({{ '/getting-started/' | relative_url }})
- [Recipes — copy-paste snippets]({{ '/recipes/' | relative_url }})
- [How to add Liquid Glass in React Native]({{ '/react-native-liquid-glass/' | relative_url }})
- [A react-native-blur / expo-blur alternative]({{ '/react-native-blur-alternative/' | relative_url }})
- [FAQ]({{ '/faq/' | relative_url }})
- [GitHub repo]({{ site.repo_url }}) · [npm]({{ site.npm_url }})

---

<!-- JSON-LD: helps Google/answer engines parse this as a software project. -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "React Native Liquid Glass",
  "alternateName": "react-native-liquid-glassmorphism",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "iOS, Android",
  "description": "React Native library for authentic Liquid Glass on iOS and Android from one declarative component. Native UIGlassEffect on iOS 26, real-time AGSL refractive-lens shader on Android, custom shapes, interactive touch/tilt, Expo config plugin, TypeScript, New Architecture ready.",
  "programmingLanguage": ["TypeScript", "Swift", "Kotlin"],
  "license": "https://opensource.org/licenses/MIT",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  "author": { "@type": "Person", "name": "Himanshu Lal", "url": "https://github.com/himanshu-lal4" },
  "downloadUrl": "https://www.npmjs.com/package/react-native-liquid-glassmorphism",
  "codeRepository": "https://github.com/himanshu-lal4/react-native-liquid-glassmorphism",
  "keywords": "react native liquid glass, react native glassmorphism, ios 26 liquid glass, android liquid glass, uiglasseffect, react native blur alternative, expo liquid glass, react native frosted glass"
}
</script>
