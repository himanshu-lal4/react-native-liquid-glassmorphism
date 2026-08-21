---
layout: page
title: "Getting Started"
description: "Install react-native-liquid-glassmorphism, rebuild the native app, and drop in a LiquidGlassView — setup for React Native and Expo."
permalink: /getting-started/
---

# Getting started

Add authentic Liquid Glass to a React Native (or Expo) app in three steps.

## 1. Install

{% raw %}
```bash
npm install react-native-liquid-glassmorphism
# yarn add react-native-liquid-glassmorphism
# pnpm add react-native-liquid-glassmorphism
# Expo: npx expo install react-native-liquid-glassmorphism
```
{% endraw %}

This is a **native module**, so it needs a native build — it does **not** run in Expo Go. On Expo, use a [development build](https://docs.expo.dev/develop/development-builds/introduction/) or `expo prebuild`. On React Native CLI, reinstall pods (`cd ios && pod install`) and rebuild.

| Platform | Minimum | Full effect |
| --- | --- | --- |
| iOS | iOS 15 (blur fallback) | **iOS 26 SDK / Xcode 26** — native `UIGlassEffect` |
| Android | API 24 (translucent fallback) | **API 33+** — AGSL refractive shader |
| React Native | 0.83+ | New **or** old architecture |

## 2. Add a glass surface

{% raw %}
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
{% endraw %}

Children render crisply **on top** of the glass — only the backdrop behind the view is blurred and refracted. Put the glass over something visually interesting (a photo, gradient, or scrolling content) to see the effect.

## 3. (Optional) add the Expo config plugin

The native module autolinks, so `expo prebuild` picks it up with no manual setup. You can optionally list the plugin in your app config:

{% raw %}
```json
{ "expo": { "plugins": ["react-native-liquid-glassmorphism"] } }
```
{% endraw %}

It's a pass-through today — the effect degrades by OS version at runtime, so no minimum-SDK, permission, or `Info.plist` changes are needed.

## 4. Start from a preset (optional)

Six tuned starting points, so the common surfaces don't need the full prop table. A preset is merged as `{ ...preset, ...yourProps }`, so anything you pass explicitly still wins:

{% raw %}
```tsx
<LiquidGlassView preset="floatingTabBar" borderRadius={32} />
```
{% endraw %}

| Preset | For |
| --- | --- |
| `navigationBar` | A pinned header with content scrolling under it |
| `floatingTabBar` | A detached, fully-rounded bar above the content |
| `cardOverMedia` | A readable card over photography or video |
| `compactControl` | A chip, badge or small floating control |
| `frosted` | Heavy and matte — a settings sheet or modal backdrop |
| `crystal` | Thin, hard and deeply refracting — decorative |

The raw map is exported as `GlassPresets` if you want to read or extend the values.

## It doesn't have to be Liquid Glass

The same component covers the surfaces you'd otherwise reach for a blur view, an overlay, or a hand-rolled glassmorphism card for. The knobs are primitives, not modes — turn the glass-specific parts off and you're left with exactly the material you asked for:

{% raw %}
```tsx
// A plain blurred pane — a drop-in for a conventional blur view.
<LiquidGlassView rim={false} specular={false} thickness={0} blurRadius={20} />

// Glassmorphism: transparent, blurred, tinted.
<LiquidGlassView variant="clear" blurRadius={14} tintColor="rgba(255,255,255,0.16)" />

// A modal backdrop — blurred and dimmed, behind a sheet.
<LiquidGlassView dim={0.5} blurRadius={24} rim={false} style={StyleSheet.absoluteFill} />
```
{% endraw %}

`blurRadius` is an explicit radius in dp that overrides whatever `intensity` would have derived. Reach for it whenever `intensity` isn't giving you enough control — most often on `clear` glass, which deliberately blurs far less than `regular` and so spans a narrow range across the whole 0–100 scale. A useful range is roughly `0`–`30`, and `0` is a genuinely unblurred pane.

## Knowing what the device can do

`getGlassCapabilities()` answers *before* you mount anything, so you can pick a different design rather than discovering the fallback at runtime:

{% raw %}
```tsx
import { getGlassCapabilities, useGlassSupport } from 'react-native-liquid-glassmorphism';

const { tier } = getGlassCapabilities();
// 'glass' | 'refraction' | 'blur' | 'tint' | 'none'
```
{% endraw %}

`onPipelineReady` reports the tier that **actually rendered** for one view, and `onError` fires when a view can't do what its props asked for — a shader that wouldn't compile, an unparseable `shape`. Both are optional; everything is logged natively too.

On Android, `paused` suspends the per-frame backdrop capture — the single most expensive thing the effect does — for views that are mounted but not being looked at. Views the OS itself reports as off-screen pause automatically.

## Next steps

- [How to add Liquid Glass in React Native]({{ '/react-native-liquid-glass/' | relative_url }})
- [A react-native-blur / expo-blur alternative]({{ '/react-native-blur-alternative/' | relative_url }})
- [FAQ]({{ '/faq/' | relative_url }})
- Full API reference: [README on GitHub]({{ site.repo_url }}#readme)
