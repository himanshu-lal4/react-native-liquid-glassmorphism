---
layout: page
title: "How to Add Liquid Glass"
description: "Step-by-step guide to iOS 26 Liquid Glass and matching Android refraction in React Native: variants, tint, touch and tilt, custom shapes, fallbacks."
permalink: /react-native-liquid-glass/
---

# How to add Liquid Glass in React Native

**Liquid Glass** (Apple's iOS 26 material — also called *glassmorphism*, *frosted glass*, or a *glass/vibrancy effect*) is a translucent surface that blurs, tints, and **refracts** the content behind it. Apple ships it natively on iOS 26 via `UIGlassEffect`; there is no system equivalent on Android. `react-native-liquid-glassmorphism` gives you both from one component: the native effect on iOS and a real-time **AGSL refraction shader** on Android.

## Basic glass surface

{% raw %}
```tsx
import { LiquidGlassView } from 'react-native-liquid-glassmorphism';

<LiquidGlassView variant="regular" borderRadius={24} style={{ padding: 16 }}>
  <Text>Frosted glass content</Text>
</LiquidGlassView>
```
{% endraw %}

- `variant="regular"` — adaptive frosted glass (the default).
- `variant="clear"` — lighter, more transparent glass, ideal over photos and video.

## Tint the glass

Layer a color over the blurred backdrop. Use `rgba()` or 8-digit hex to control strength:

{% raw %}
```tsx
<LiquidGlassView tintColor="rgba(10,132,255,0.5)" />
```
{% endraw %}

## Make it interactive (touch + tilt)

{% raw %}
```tsx
<LiquidGlassView interactive />
```
{% endraw %}

On iOS 26 this enables Apple's interactive `UIGlassEffect`. On Android it adds a specular **bloom and optical magnification** under the finger, plus a **moving specular highlight** that follows device tilt — so the glass feels physical.

## Give the glass any shape

The `shape` prop lenses the backdrop **through a silhouette** — a real optical shape, not just a clip. Analytic shapes are generated for you; you can also pass an arbitrary (even concave) SVG path:

{% raw %}
```tsx
<LiquidGlassView shape={{ type: 'circle' }} style={{ width: 96, height: 96 }} />
<LiquidGlassView shape={{ type: 'squircle', n: 4 }} />
<LiquidGlassView shape={{ type: 'polygon', sides: 6 }} />
<LiquidGlassView shape={{ type: 'points', points: [[0, 0], [1, 0], [0.5, 1]] }} />

// Arbitrary SVG path — e.g. a curved tab-bar dock with a center notch:
<LiquidGlassView
  shape={{ type: 'path', d: notchPath, width: SCREEN_W, height: 96 }}
  style={{ width: SCREEN_W, height: 96 }}
/>
```
{% endraw %}

The shape is stretched to fill the view's bounds, so size the view to the shape's aspect ratio to keep it undistorted. SVG paths support `M/L/H/V/C/S/Q/T/Z` (absolute + relative); elliptic arcs (`A`) aren't supported — use béziers.

## Tune the Android "liquid volume"

`thickness` (Android only) scales how deep the lensing reads:

{% raw %}
```tsx
<LiquidGlassView thickness={1.6} />  // 0 = flat pane · 1 = default · ~2 = deep lens
```
{% endraw %}

## How the effect degrades

The component always renders *something* readable — it steps down by OS capability:

- **iOS 26+** — native `UIGlassEffect` (regular/clear, interactive, tint, corner radius).
- **iOS 15–25** — `UIBlurEffect` fallback, bucketed by `intensity`.
- **Android 13+ (API 33)** — per-frame backdrop capture → GPU blur → AGSL refractive-lens shader.
- **Android 12 (API 31–32)** — `RenderEffect` blur + tint.
- **Below Android 12** — a translucent tint.

## Common use cases

- **Frosted nav bars, tab bars, and docks** — including a notched tab bar via a custom SVG `path`.
- **Glass cards and modals** over photos or gradients.
- **Media controls** over video (use `variant="clear"`).
- **HUD / overlay chrome** that stays legible over any backdrop.

## FAQ

### How do I add Liquid Glass to a React Native app?

Install `react-native-liquid-glassmorphism`, rebuild the native app, and wrap content in `<LiquidGlassView>`. It's a native module, so use a dev build or `expo prebuild` rather than Expo Go. On iOS 26 it renders Apple's native `UIGlassEffect`; on Android it runs a real-time AGSL refraction shader. Children render crisply on top while only the backdrop is treated.

### Does it work on both iOS and Android?

Yes, from one component. iOS 26 renders Apple's native `UIGlassEffect`; Android has no system glass, so the library reproduces the optics in a per-frame AGSL refraction shader (Android 13 / API 33+) with edge refraction, chromatic dispersion, a mirrored edge reflection, and a Fresnel rim. Older OS versions fall back automatically to blur or a translucent tint.

### Can I use it in Expo Go?

No. It's a custom native module (`UIGlassEffect` on iOS, an AGSL `RuntimeShader` on Android), and Expo Go can only load native code compiled into it. Use `expo prebuild` or a [development build]({{ '/expo-liquid-glass/' | relative_url }}). The module autolinks, and an optional Expo config plugin is included.

### What are the requirements?

React Native 0.83+ (New or old architecture), with no JS runtime dependencies beyond React Native itself. The full effect needs the iOS 26 SDK / Xcode 26 on iOS or Android 13 (API 33+) on Android; below those it degrades to blur or tint. First-class TypeScript types are included.

### Do I need iOS 26 for it to render?

Only for Apple's native `UIGlassEffect` (the real Liquid Glass), which needs the iOS 26 SDK / Xcode 26. On iOS 15–25 it automatically falls back to a `UIBlurEffect` frosted look bucketed by `intensity`, so your UI still renders correctly on older devices.

## See also

- [Getting started]({{ '/getting-started/' | relative_url }})
- [iOS 26 Liquid Glass & UIGlassEffect]({{ '/ios-26-liquid-glass/' | relative_url }})
- [Android Liquid Glass — AGSL refraction shader]({{ '/android-liquid-glass/' | relative_url }})
- [Expo Liquid Glass setup — dev build & config plugin]({{ '/expo-liquid-glass/' | relative_url }})
- [React Native glassmorphism vs Liquid Glass]({{ '/react-native-glassmorphism/' | relative_url }})
- [A react-native-blur / expo-blur alternative]({{ '/react-native-blur-alternative/' | relative_url }})
- [FAQ]({{ '/faq/' | relative_url }})

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "React Native Liquid Glass",
  "alternateName": "react-native-liquid-glassmorphism",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "iOS, Android",
  "description": "Add authentic Liquid Glass to a React Native app on both iOS and Android from one declarative component: native UIGlassEffect on iOS 26 and a real-time AGSL refraction shader on Android 13+, with variants, tint, interactive touch/tilt, custom shapes, and automatic blur or tint fallbacks on older OS versions.",
  "programmingLanguage": ["TypeScript", "Swift", "Kotlin"],
  "license": "https://opensource.org/licenses/MIT",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  "author": { "@type": "Person", "name": "Himanshu Lal", "url": "https://github.com/himanshu-lal4" },
  "downloadUrl": "https://www.npmjs.com/package/react-native-liquid-glassmorphism",
  "codeRepository": "https://github.com/himanshu-lal4/react-native-liquid-glassmorphism",
  "keywords": "how to add liquid glass react native, react native liquid glass tutorial, ios 26 liquid glass, android liquid glass, uiglasseffect, react native glass effect"
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "How do I add Liquid Glass to a React Native app?",
      "acceptedAnswer": { "@type": "Answer", "text": "Install react-native-liquid-glassmorphism, rebuild the native app, and wrap content in a LiquidGlassView. It's a native module, so use a dev build or expo prebuild rather than Expo Go. On iOS 26 it renders Apple's native UIGlassEffect; on Android it runs a real-time AGSL refraction shader. Children render crisply on top while only the backdrop is treated." } },
    { "@type": "Question", "name": "Does it work on both iOS and Android?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes, from one component. iOS 26 renders Apple's native UIGlassEffect; Android has no system glass, so the library reproduces the optics in a per-frame AGSL refraction shader (Android 13 / API 33+) with edge refraction, chromatic dispersion, a mirrored edge reflection, and a Fresnel rim. Older OS versions fall back automatically to blur or a translucent tint." } },
    { "@type": "Question", "name": "Can I use it in Expo Go?",
      "acceptedAnswer": { "@type": "Answer", "text": "No. It is a custom native module using UIGlassEffect on iOS and an AGSL RuntimeShader on Android, and Expo Go can only load native code compiled into it. Use expo prebuild or a development build. The module autolinks, and an optional Expo config plugin is included." } },
    { "@type": "Question", "name": "What are the requirements?",
      "acceptedAnswer": { "@type": "Answer", "text": "React Native 0.83 or later, on the New or old architecture, with no extra JS runtime dependencies beyond React Native. The full effect needs the iOS 26 SDK / Xcode 26 on iOS or Android 13 (API 33+) on Android; below those it degrades to blur or tint. First-class TypeScript types are included." } },
    { "@type": "Question", "name": "Do I need iOS 26 for it to render?",
      "acceptedAnswer": { "@type": "Answer", "text": "Only for Apple's native UIGlassEffect (the real Liquid Glass), which needs the iOS 26 SDK / Xcode 26. On iOS 15 to 25 it automatically falls back to a UIBlurEffect frosted look bucketed by intensity, so the UI still renders correctly on older devices." } }
  ]
}
</script>
