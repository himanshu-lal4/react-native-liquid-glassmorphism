---
layout: page
title: "iOS 26 Liquid Glass — UIGlassEffect"
description: "Render Apple's iOS 26 Liquid Glass in React Native with the native UIGlassEffect: regular and clear styles, interactive glass, tint, shapes and fallbacks."
permalink: /ios-26-liquid-glass/
---

# iOS 26 Liquid Glass in React Native

Apple introduced **Liquid Glass** in iOS 26 as a real system material, exposed to UIKit as `UIGlassEffect` — a `UIVisualEffect` you install on a `UIVisualEffectView`. `react-native-liquid-glassmorphism` wraps it in a declarative React Native component, so `<LiquidGlassView>` renders Apple's *actual* glass, not an imitation of it.

{% raw %}
```bash
npm install react-native-liquid-glassmorphism
# yarn add react-native-liquid-glassmorphism
# Expo (dev build / prebuild — not Expo Go):
npx expo install react-native-liquid-glassmorphism
```
{% endraw %}

Then reinstall pods and rebuild:

{% raw %}
```bash
cd ios && pod install && cd ..
npx react-native run-ios
```
{% endraw %}

## What is UIGlassEffect?

`UIGlassEffect` is the iOS 26 API for Apple's Liquid Glass material. It ships two styles:

- `UIGlassEffectStyleRegular` — adaptive frosted glass, the default chrome material.
- `UIGlassEffectStyleClear` — lighter, largely transparent refractive glass, intended for media.

It also has an `interactive` flag that makes the glass respond to touch the way system controls do, and a `tintColor` that the OS applies *within* the material rather than as a flat overlay.

The library maps its public props straight onto these:

| Library prop | iOS 26 mapping |
| --- | --- |
| `variant="regular"` | `UIGlassEffectStyleRegular` |
| `variant="clear"` | `UIGlassEffectStyleClear` |
| `interactive` | `UIGlassEffect.interactive = YES` |
| `tintColor` | The glass's native tint (not a flat overlay) |
| `borderRadius` | Native corner configuration, so the glass renders its own rounded shape |
| `shape` | A `CAShapeLayer` mask over the effect view |

## How do I render iOS 26 Liquid Glass?

{% raw %}
```tsx
import { Text, StyleSheet } from 'react-native';
import { LiquidGlassView } from 'react-native-liquid-glassmorphism';

export function GlassCard() {
  return (
    <LiquidGlassView
      variant="regular"
      tintColor="rgba(10,132,255,0.5)"
      interactive
      borderRadius={24}
      style={styles.card}
    >
      <Text style={styles.title}>Liquid Glass</Text>
      <Text style={styles.body}>Rendered by the OS on iOS 26.</Text>
    </LiquidGlassView>
  );
}

const styles = StyleSheet.create({
  card: { width: 300, padding: 22, gap: 8, overflow: 'hidden' },
  title: { color: '#fff', fontSize: 22, fontWeight: '800' },
  body: { color: 'rgba(255,255,255,0.9)', fontSize: 14, lineHeight: 20 },
});
```
{% endraw %}

Children render crisply on top — only the backdrop behind the view is treated. Put the glass over a photo, gradient, or scrolling content; over a flat solid colour there is nothing for the material to work with.

> **`interactive` needs children.** The interactive response is driven by the glass view's own touches, so foreground content must be a **child** of `<LiquidGlassView>`, not a sibling rendered over an `absoluteFill` glass.

## What are the iOS requirements?

| | Minimum | Full native Liquid Glass |
| --- | --- | --- |
| iOS runtime | iOS 15 | **iOS 26** |
| Build toolchain | — | **iOS 26 SDK / Xcode 26** |

Two conditions must *both* hold for `UIGlassEffect` to be used:

1. **The app is compiled against the iOS 26 SDK.** The native code is guarded at compile time by `__IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_26_0`. If you build with Xcode 25 or earlier, the glass path isn't compiled in at all — every device gets the blur fallback, including devices running iOS 26.
2. **The device is running iOS 26 at runtime**, checked with `@available(iOS 26.0, *)`.

If your app looks like a plain blur on an iOS 26 device, condition 1 is almost always the reason. Upgrade Xcode and rebuild.

## What happens on iOS 15–25?

The component falls back to `UIVisualEffectView` + `UIBlurEffect`, choosing a system material whose heaviness tracks the `intensity` prop:

| Condition | `UIBlurEffectStyle` |
| --- | --- |
| `variant="clear"` | `systemUltraThinMaterial` |
| `intensity >= 80` | `systemThickMaterial` |
| `intensity >= 50` | `systemMaterial` |
| `intensity >= 25` | `systemThinMaterial` |
| otherwise | `systemUltraThinMaterial` |

On this path `tintColor` is applied as a flat overlay above the material (on real iOS 26 glass, the OS tints natively instead). The layout, corner radius, custom shape mask, and children all behave identically — only the material's realism steps down. You do not need to branch in JavaScript; there's no version check to write.

## Do I need to gate by iOS version in my code?

No. The gating is entirely inside the native view. Write one component tree and it renders the best available material on every device:

{% raw %}
```tsx
// This is all you write. No Platform.Version checks, no conditional imports.
<LiquidGlassView variant="clear" interactive borderRadius={28} style={styles.bar}>
  {children}
</LiquidGlassView>
```
{% endraw %}

The one thing worth designing for is that the **fallback is a blur, not a lens** — content behind a pre-26 glass surface won't bend around the rim. If your layout depends on the refraction being visible, verify it on an iOS 15–25 device too.

## Which props are no-ops on iOS?

iOS fixes the glass optics in the OS, so the Android-only tuning props do nothing here. They're safe to set unconditionally — you don't need `Platform.select`:

- `tilt` — the OS renders the glass specular itself.
- `refraction` — refraction is rendered by the OS.
- `thickness` — `UIGlassEffect` optics are OS-fixed.
- `edgeReflectionStrength` — likewise.
- `legibilityFloor` — likewise; use a normal RN view for a scrim if you need one on iOS.

`variant`, `tintColor`, `intensity`, `interactive`, `borderRadius`, `shape`, and all standard `ViewProps` are cross-platform.

## Can iOS glass be a custom shape?

Yes. On iOS a custom `shape` masks the effect view with a `CAShapeLayer` built from the normalised path, so any silhouette works — including concave ones:

{% raw %}
```tsx
<LiquidGlassView shape={{ type: 'circle' }} style={{ width: 96, height: 96 }} />
<LiquidGlassView shape={{ type: 'squircle', n: 4 }} />
<LiquidGlassView shape={{ type: 'polygon', sides: 6 }} />
<LiquidGlassView shape={{ type: 'star', points: 5, innerRatio: 0.5 }} />

// Arbitrary SVG path
<LiquidGlassView
  shape={{ type: 'path', d: notchPath, width: DOCK_W, height: DOCK_H }}
  style={{ width: DOCK_W, height: DOCK_H }}
/>
```
{% endraw %}

The shape is stretched to fill the view's bounds, so size the view to the shape's aspect ratio. SVG paths support `M/L/H/V/C/S/Q/T/Z` (absolute and relative); elliptic arcs (`A`) aren't supported — use béziers. When `shape` is set, `borderRadius` is ignored (the silhouette defines the outline).

## FAQ

### Does React Native Liquid Glass require iOS 26?

For Apple's real `UIGlassEffect`, yes — and you must also **build with the iOS 26 SDK / Xcode 26**. On iOS 15–25, or when compiled against an older SDK, the component automatically falls back to a `UIBlurEffect` frosted material bucketed by `intensity`.

### How do I use UIGlassEffect from React Native?

Install `react-native-liquid-glassmorphism`, rebuild the native app, and render `<LiquidGlassView variant="regular" interactive />`. The library installs a real `UIGlassEffect` on a `UIVisualEffectView` under the hood; `variant` selects the regular or clear style.

### Why does my iOS 26 device still show a plain blur?

Almost always because the app was compiled with an older Xcode. The `UIGlassEffect` code path is compile-time gated on the iOS 26 SDK, so building with Xcode 25 or earlier omits it entirely regardless of the device's OS version. Upgrade Xcode and rebuild.

### Does it also work on Android?

Yes — that's the point of the library. Android has no system Liquid Glass, so it reproduces the optics with a real-time AGSL refraction shader on API 33+, with blur and tint fallbacks below. See [Android Liquid Glass]({{ '/android-liquid-glass/' | relative_url }}).

### Does it support the New Architecture?

Yes. `LiquidGlassView` is a Fabric component generated with codegen, and the same view manager delegate covers the old architecture too.

## See also

- [Getting started]({{ '/getting-started/' | relative_url }})
- [Android Liquid Glass — AGSL refraction]({{ '/android-liquid-glass/' | relative_url }})
- [Expo Liquid Glass setup]({{ '/expo-liquid-glass/' | relative_url }})
- [React Native glassmorphism vs Liquid Glass]({{ '/react-native-glassmorphism/' | relative_url }})
- [An expo-blur alternative]({{ '/expo-blur-alternative/' | relative_url }})
- [Recipes]({{ '/recipes/' | relative_url }}) · [FAQ]({{ '/faq/' | relative_url }})
- [GitHub repo]({{ site.repo_url }}) · [npm]({{ site.npm_url }})

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "React Native Liquid Glass — iOS 26 UIGlassEffect",
  "alternateName": "react-native-liquid-glassmorphism",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "iOS 26 or later for native UIGlassEffect; iOS 15 minimum with a UIBlurEffect fallback",
  "description": "React Native component that renders Apple's native iOS 26 Liquid Glass via UIGlassEffect — regular and clear styles, interactive glass, native tint, custom CAShapeLayer silhouettes — with automatic UIBlurEffect fallback on iOS 15 to 25.",
  "programmingLanguage": ["TypeScript", "Objective-C++", "Swift"],
  "license": "https://opensource.org/licenses/MIT",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  "author": { "@type": "Person", "name": "Himanshu Lal", "url": "https://github.com/himanshu-lal4" },
  "downloadUrl": "https://www.npmjs.com/package/react-native-liquid-glassmorphism",
  "codeRepository": "https://github.com/himanshu-lal4/react-native-liquid-glassmorphism",
  "keywords": "ios 26 liquid glass react native, uiglasseffect, uiglasseffectstyle, react native ios glass, uivisualeffectview, uiblureffect fallback, apple liquid glass"
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "Does React Native Liquid Glass require iOS 26?",
      "acceptedAnswer": { "@type": "Answer", "text": "For Apple's real UIGlassEffect, yes, and the app must also be built with the iOS 26 SDK / Xcode 26. On iOS 15 to 25, or when compiled against an older SDK, the component automatically falls back to a UIBlurEffect frosted material bucketed by the intensity prop." } },
    { "@type": "Question", "name": "How do I use UIGlassEffect from React Native?",
      "acceptedAnswer": { "@type": "Answer", "text": "Install react-native-liquid-glassmorphism, rebuild the native app, and render a LiquidGlassView with variant regular or clear and the interactive prop. The library installs a real UIGlassEffect on a UIVisualEffectView under the hood." } },
    { "@type": "Question", "name": "Why does my iOS 26 device still show a plain blur?",
      "acceptedAnswer": { "@type": "Answer", "text": "Almost always because the app was compiled with an older Xcode. The UIGlassEffect code path is compile-time gated on the iOS 26 SDK, so building with Xcode 25 or earlier omits it entirely regardless of the device's OS version. Upgrade Xcode and rebuild." } },
    { "@type": "Question", "name": "Does the iOS 26 Liquid Glass component also work on Android?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes. Android has no system Liquid Glass, so the library reproduces the optics with a real-time AGSL refraction shader on Android 13 / API 33 and later, with RenderEffect blur and translucent tint fallbacks below that." } },
    { "@type": "Question", "name": "Does it support the New Architecture?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes. LiquidGlassView is a Fabric component generated with codegen, and the same view manager delegate covers the old architecture too." } }
  ]
}
</script>
