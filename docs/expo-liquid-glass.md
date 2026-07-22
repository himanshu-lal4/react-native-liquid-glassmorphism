---
layout: page
title: "Expo Liquid Glass — Setup with a Dev Build (not Expo Go)"
description: "How to add Liquid Glass to an Expo app: install react-native-liquid-glassmorphism, run expo prebuild or build a development build, and add the optional config plugin. Explains clearly why this cannot work in Expo Go and what each platform needs."
permalink: /expo-liquid-glass/
---

# Expo Liquid Glass

`react-native-liquid-glassmorphism` works with Expo — but **it does not run in Expo Go**. Read that first, because it's the single most common source of "the component is blank" reports.

## Why doesn't Liquid Glass work in Expo Go?

Expo Go is a prebuilt app containing a fixed set of native modules. It cannot load native code that isn't already compiled into it.

Liquid Glass is irreducibly native:

- On iOS it installs a **`UIGlassEffect`** on a `UIVisualEffectView` (iOS 26).
- On Android it compiles an **AGSL `RuntimeShader`** and chains it as a `RenderEffect` on a hardware `RenderNode` (API 33+).

Neither can be shipped as JavaScript, so there is no way to make this run in Expo Go — not with a workaround, not in a future version. You need a **development build** or `expo prebuild`.

This isn't unusual: the same is true of any library with custom native views. It only means one extra build step, and after that the normal Expo dev loop (Fast Refresh, `expo start`) works exactly as before.

## How do I set it up?

{% raw %}
```bash
npx expo install react-native-liquid-glassmorphism
```
{% endraw %}

Then produce a native build. Either run it locally:

{% raw %}
```bash
npx expo run:ios      # or
npx expo run:android
```
{% endraw %}

…or create a [development build](https://docs.expo.dev/develop/development-builds/introduction/) with EAS:

{% raw %}
```bash
npx expo install expo-dev-client
eas build --profile development --platform ios     # or --platform android
```
{% endraw %}

After the build installs, `npx expo start --dev-client` gives you the usual workflow. You only need to rebuild when native dependencies change — not when you edit JavaScript.

## Do I need the config plugin?

The native module is picked up by **Expo autolinking**, so `expo prebuild` finds it with no manual configuration. The config plugin is optional and, today, a deliberate pass-through:

{% raw %}
```json
{
  "expo": {
    "plugins": ["react-native-liquid-glassmorphism"]
  }
}
```
{% endraw %}

There is nothing for it to do yet — the effect degrades by **OS version at runtime**, so there are no minimum-SDK bumps, permissions, or `Info.plist` entries to apply at build time. The plugin exists as the single place native configuration would live if the library ever needs it, so listing it now is future-proofing rather than a requirement.

Notably, the Android `tilt` prop uses the gravity/accelerometer sensor, which requires **no runtime permission** on Android — another reason the plugin stays empty.

## What does a working Expo component look like?

{% raw %}
```tsx
import { View, Image, Text, StyleSheet } from 'react-native';
import { LiquidGlassView } from 'react-native-liquid-glassmorphism';

export default function App() {
  return (
    <View style={styles.screen}>
      <Image
        source={{ uri: 'https://picsum.photos/800/1200' }}
        style={StyleSheet.absoluteFill}
      />
      <LiquidGlassView
        variant="regular"
        tintColor="rgba(10,132,255,0.5)"
        intensity={60}
        interactive
        borderRadius={24}
        style={styles.card}
      >
        <Text style={styles.title}>Liquid Glass</Text>
        <Text style={styles.body}>Native on iOS 26 · AGSL shader on Android 13+</Text>
      </LiquidGlassView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { width: 300, padding: 22, gap: 8, overflow: 'hidden' },
  title: { color: '#fff', fontSize: 22, fontWeight: '800' },
  body: { color: 'rgba(255,255,255,0.9)', fontSize: 14, lineHeight: 20 },
});
```
{% endraw %}

The glass needs something interesting behind it — a photo, gradient, or scrolling content. Over a flat colour there's nothing to blur or refract.

> **`interactive` and `tilt` need children.** Both effects are driven by the glass view's own touches, so foreground content must be a **child** of `<LiquidGlassView>`, not a sibling rendered over an `absoluteFill` glass. With no children they're a silent no-op.

The `example/` app in the repo is itself an Expo app, so it's a working reference:

{% raw %}
```bash
cd example
npx expo run:ios      # or: npx expo run:android
```
{% endraw %}

## What are the platform requirements?

| Platform | Minimum | Full effect |
| --- | --- | --- |
| iOS | iOS 15 (`UIBlurEffect` fallback) | **iOS 26 SDK / Xcode 26** — native `UIGlassEffect` |
| Android | API 24 (translucent tint fallback) | **API 33+** — AGSL refractive shader |
| React Native | 0.83+ | New **or** old architecture |

On Android, build with **compileSdk 34+** and a current NDK (tested with NDK `27.1.12297006`). If a first EAS or local build fails auto-installing the NDK, install it once via the SDK Manager and rebuild.

You don't need to gate anything in JavaScript — the component checks the OS at runtime and steps down to the best available material by itself.

## Does it work with Expo Router / managed workflow?

Yes. "Managed workflow" and "Expo Go" aren't the same thing: you can stay fully managed (no `ios/` or `android/` folders checked in, config via `app.json`) and still use a development build produced by EAS. Expo Router is unaffected — `<LiquidGlassView>` is just a view.

## FAQ

### Can I use Liquid Glass in Expo Go?

No. Expo Go ships a fixed set of native modules and cannot load `UIGlassEffect` (iOS) or an AGSL `RuntimeShader` (Android). Use a development build or `expo prebuild`. This is a hard platform limit, not a missing feature.

### Do I have to eject from Expo?

No. Ejecting isn't part of modern Expo. Use `npx expo run:ios` / `run:android` locally, or `eas build --profile development` for a dev build — your project stays managed and `app.json`-configured.

### Do I need to add the config plugin?

It's optional. Expo autolinking already picks up the native module during `expo prebuild`. The plugin is a pass-through today because the effect degrades by OS version at runtime, so no SDK, permission, or `Info.plist` changes are needed.

### The component renders but I see no glass. What's wrong?

Check three things in order: you're on a dev build rather than Expo Go; there is visually interesting content *behind* the view (a photo or gradient, not a flat colour); and the device meets the OS requirement — iOS 26 for native glass, Android 13 / API 33+ for the refraction shader. On Android, `adb logcat -s LiquidGlass` prints the render tier that actually ran.

### Does it work on Expo for web?

Not yet. On web the component renders a best-effort translucent surface (a tinted, rounded, bordered view) rather than real glass — the library is mobile-only for now.

## See also

- [Getting started]({{ '/getting-started/' | relative_url }})
- [iOS 26 Liquid Glass & UIGlassEffect]({{ '/ios-26-liquid-glass/' | relative_url }})
- [Android Liquid Glass — AGSL refraction]({{ '/android-liquid-glass/' | relative_url }})
- [An expo-blur alternative]({{ '/expo-blur-alternative/' | relative_url }})
- [Recipes]({{ '/recipes/' | relative_url }}) · [FAQ]({{ '/faq/' | relative_url }})
- [GitHub repo]({{ site.repo_url }}) · [npm]({{ site.npm_url }})

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "React Native Liquid Glass — Expo",
  "alternateName": "react-native-liquid-glassmorphism",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "iOS, Android — requires an Expo development build or prebuild; does not run in Expo Go",
  "description": "Liquid Glass for Expo apps: native UIGlassEffect on iOS 26 and a real-time AGSL refraction shader on Android 13+, installed with expo install and an optional pass-through config plugin. Requires a development build or expo prebuild — it cannot run in Expo Go.",
  "programmingLanguage": ["TypeScript", "Objective-C++", "Kotlin"],
  "license": "https://opensource.org/licenses/MIT",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  "author": { "@type": "Person", "name": "Himanshu Lal", "url": "https://github.com/himanshu-lal4" },
  "downloadUrl": "https://www.npmjs.com/package/react-native-liquid-glassmorphism",
  "codeRepository": "https://github.com/himanshu-lal4/react-native-liquid-glassmorphism",
  "keywords": "expo liquid glass, expo glass effect, expo config plugin, expo dev build, expo prebuild, expo go native module, react native liquid glass expo"
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "Can I use Liquid Glass in Expo Go?",
      "acceptedAnswer": { "@type": "Answer", "text": "No. Expo Go ships a fixed set of native modules and cannot load UIGlassEffect on iOS or an AGSL RuntimeShader on Android. Use a development build or expo prebuild. This is a hard platform limit rather than a missing feature." } },
    { "@type": "Question", "name": "Do I have to eject from Expo to use Liquid Glass?",
      "acceptedAnswer": { "@type": "Answer", "text": "No. Ejecting is not part of modern Expo. Run npx expo run:ios or run:android locally, or eas build --profile development for a development build. Your project stays managed and configured through app.json." } },
    { "@type": "Question", "name": "Do I need to add the Expo config plugin?",
      "acceptedAnswer": { "@type": "Answer", "text": "It is optional. Expo autolinking already picks up the native module during expo prebuild. The plugin is a pass-through today because the effect degrades by OS version at runtime, so no SDK, permission, or Info.plist changes are needed." } },
    { "@type": "Question", "name": "The Expo component renders but I see no glass. What is wrong?",
      "acceptedAnswer": { "@type": "Answer", "text": "Check three things: you are running a development build rather than Expo Go; there is visually interesting content behind the view such as a photo or gradient rather than a flat colour; and the device meets the OS requirement, iOS 26 for native glass or Android 13 / API 33 and later for the refraction shader. On Android, adb logcat -s LiquidGlass prints which render tier ran." } },
    { "@type": "Question", "name": "Does Expo Liquid Glass work on web?",
      "acceptedAnswer": { "@type": "Answer", "text": "Not yet. On web the component renders a best-effort translucent surface — a tinted, rounded, bordered view — rather than real glass. The library is mobile-only for now." } }
  ]
}
</script>
