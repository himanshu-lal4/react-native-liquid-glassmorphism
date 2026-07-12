---
layout: page
title: "Getting Started — React Native Liquid Glass"
description: "Install and set up authentic Liquid Glass in a React Native or Expo app: add react-native-liquid-glassmorphism, rebuild the native app, and drop in a LiquidGlassView."
permalink: /getting-started/
---

# Getting started

Add authentic Liquid Glass to a React Native (or Expo) app in three steps.

## 1. Install

```bash
npm install react-native-liquid-glassmorphism
# yarn add react-native-liquid-glassmorphism
# pnpm add react-native-liquid-glassmorphism
# Expo: npx expo install react-native-liquid-glassmorphism
```

This is a **native module**, so it needs a native build — it does **not** run in Expo Go. On Expo, use a [development build](https://docs.expo.dev/develop/development-builds/introduction/) or `expo prebuild`. On React Native CLI, reinstall pods (`cd ios && pod install`) and rebuild.

| Platform | Minimum | Full effect |
| --- | --- | --- |
| iOS | iOS 15 (blur fallback) | **iOS 26 SDK / Xcode 26** — native `UIGlassEffect` |
| Android | API 24 (translucent fallback) | **API 33+** — AGSL refractive shader |
| React Native | 0.83+ | New **or** old architecture |

## 2. Add a glass surface

```tsx
import { LiquidGlassView } from 'react-native-liquid-glassmorphism';
import { Text } from 'react-native';

export function Card() {
  return (
    <LiquidGlassView
      variant="regular"          // 'regular' (frosted) | 'clear' (transparent)
      tintColor="rgba(10,132,255,0.5)"
      interactive                // reacts to touch + device tilt
      borderRadius={24}
      style={{ padding: 16 }}
    >
      <Text>Frosted glass content</Text>
    </LiquidGlassView>
  );
}
```

Children render crisply **on top** of the glass — only the backdrop behind the view is blurred and refracted. Put the glass over something visually interesting (a photo, gradient, or scrolling content) to see the effect.

## 3. (Optional) add the Expo config plugin

The native module autolinks, so `expo prebuild` picks it up with no manual setup. You can optionally list the plugin in your app config:

```json
{ "expo": { "plugins": ["react-native-liquid-glassmorphism"] } }
```

It's a pass-through today — the effect degrades by OS version at runtime, so no minimum-SDK, permission, or `Info.plist` changes are needed.

## Next steps

- [How to add Liquid Glass in React Native]({{ '/react-native-liquid-glass/' | relative_url }})
- [A react-native-blur / expo-blur alternative]({{ '/react-native-blur-alternative/' | relative_url }})
- [FAQ]({{ '/faq/' | relative_url }})
- Full API reference: [README on GitHub]({{ site.repo_url }}#readme)
