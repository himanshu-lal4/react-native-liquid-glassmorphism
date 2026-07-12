---
layout: page
title: "How to Add Liquid Glass (Glassmorphism) in React Native — iOS & Android"
description: "Step-by-step guide to adding iOS 26 Liquid Glass and matching Android glass refraction in React Native: variants, tint, interactive touch/tilt, custom shapes, and how the effect degrades on older OS versions."
permalink: /react-native-liquid-glass/
---

# How to add Liquid Glass in React Native

**Liquid Glass** (Apple's iOS 26 material — also called *glassmorphism*, *frosted glass*, or a *glass/vibrancy effect*) is a translucent surface that blurs, tints, and **refracts** the content behind it. Apple ships it natively on iOS 26 via `UIGlassEffect`; there is no system equivalent on Android. `react-native-liquid-glassmorphism` gives you both from one component: the native effect on iOS and a real-time **AGSL refraction shader** on Android.

## Basic glass surface

```tsx
import { LiquidGlassView } from 'react-native-liquid-glassmorphism';

<LiquidGlassView variant="regular" borderRadius={24} style={{ padding: 16 }}>
  <Text>Frosted glass content</Text>
</LiquidGlassView>
```

- `variant="regular"` — adaptive frosted glass (the default).
- `variant="clear"` — lighter, more transparent glass, ideal over photos and video.

## Tint the glass

Layer a color over the blurred backdrop. Use `rgba()` or 8-digit hex to control strength:

```tsx
<LiquidGlassView tintColor="rgba(10,132,255,0.5)" />
```

## Make it interactive (touch + tilt)

```tsx
<LiquidGlassView interactive />
```

On iOS 26 this enables Apple's interactive `UIGlassEffect`. On Android it adds a specular **bloom and optical magnification** under the finger, plus a **moving specular highlight** that follows device tilt — so the glass feels physical.

## Give the glass any shape

The `shape` prop lenses the backdrop **through a silhouette** — a real optical shape, not just a clip. Analytic shapes are generated for you; you can also pass an arbitrary (even concave) SVG path:

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

The shape is stretched to fill the view's bounds, so size the view to the shape's aspect ratio to keep it undistorted. SVG paths support `M/L/H/V/C/S/Q/T/Z` (absolute + relative); elliptic arcs (`A`) aren't supported — use béziers.

## Tune the Android "liquid volume"

`thickness` (Android only) scales how deep the lensing reads:

```tsx
<LiquidGlassView thickness={1.6} />  // 0 = flat pane · 1 = default · ~2 = deep lens
```

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

## See also

- [Getting started]({{ '/getting-started/' | relative_url }})
- [A react-native-blur / expo-blur alternative]({{ '/react-native-blur-alternative/' | relative_url }})
- [FAQ]({{ '/faq/' | relative_url }})
