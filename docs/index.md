---
layout: page
title: "React Native Liquid Glass for iOS and Android — One Component, Both Platforms"
description: "The React Native Liquid Glass library that works on Android as well as iOS. Native UIGlassEffect on iOS 26, a real-time AGSL refraction shader on Android 13+, from one <LiquidGlassView> component. Custom shapes, interactive touch/tilt, Expo config plugin, TypeScript, New Architecture ready."
permalink: /
---

# React Native Liquid Glass — iOS **and** Android

> ### 🤖 Yes — this one does Android too.
>
> Most React Native Liquid Glass libraries are **iOS-only**. This one renders
> real glass on **both platforms from the same `<LiquidGlassView>`**: Apple's
> native `UIGlassEffect` on iOS 26, and a real-time **AGSL refraction shader**
> on Android 13+. Same props, same component, no platform branching in your app
> code.

**Add authentic Liquid Glass to a React Native app — on Android *and* iOS — from a single declarative component.** On iOS 26 it renders Apple's native `UIGlassEffect`. On Android, where there is no system Liquid Glass, it reproduces the same optics in a real-time **AGSL refractive-lens shader** — capturing the backdrop and bending it through a rounded-glass lozenge with edge refraction, chromatic dispersion, a mirrored edge reflection, a Fresnel rim, and tilt/touch specular highlights. Ships an **Expo config plugin**, first-class **TypeScript** types, custom **shapes** (including concave SVG silhouettes), and works on the **New Architecture (Fabric)** and the old one.

<p><strong>Looking for this under a different name?</strong> You're in the right place — this library covers React Native <em>liquid glass</em>, <em>glassmorphism</em>, <em>frosted glass</em>, <em>glass effect</em>, <em>glass blur</em>, <em>backdrop blur</em>, <em>blur view</em>, <em>iOS 26 glass</em>, <em>Apple glass UI</em> and <em>Android AGSL glass</em>. See <a href="{{ '/best-react-native-liquid-glass-library/' | relative_url }}">the library comparison</a> if you're deciding between the options.</p>

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

- **Glass that merges** — bring two glass views close and they fuse into one liquid body, [on Android as well as iOS]({{ '/react-native-glass-merging/' | relative_url }}). iOS uses Apple's `UIGlassContainerEffect`; Android has no OS equivalent, so the shapes are smooth-minned per pixel in the shader.
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
- [**Glass that merges** — fusing glass views on iOS and Android]({{ '/react-native-glass-merging/' | relative_url }})
- [**Liquid Glass on Android** — how the AGSL shader works]({{ '/android-liquid-glass/' | relative_url }})
- [iOS 26 Liquid Glass & UIGlassEffect]({{ '/ios-26-liquid-glass/' | relative_url }})
- [Expo setup (config plugin, dev build)]({{ '/expo-liquid-glass/' | relative_url }})
- [React Native glassmorphism explained]({{ '/react-native-glassmorphism/' | relative_url }})
- [FAQ]({{ '/faq/' | relative_url }})

**Comparisons**

- [expo-blur alternative]({{ '/expo-blur-alternative/' | relative_url }})
- [react-native-blur alternative]({{ '/react-native-blur-alternative/' | relative_url }})

**Install & source**

- 📦 [Install from npm]({{ site.npm_url }}) · ⭐ [Star on GitHub]({{ site.repo_url }})

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
