# react-native-liquid-glassmorphism

<p align="center">
  <a href="https://www.npmjs.com/package/react-native-liquid-glassmorphism"><img src="https://img.shields.io/npm/v/react-native-liquid-glassmorphism?color=cb3837&logo=npm&logoColor=white" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/react-native-liquid-glassmorphism"><img src="https://img.shields.io/npm/dm/react-native-liquid-glassmorphism?color=cb3837&logo=npm&logoColor=white" alt="npm downloads" /></a>
  <img src="https://img.shields.io/badge/platforms-iOS%20%7C%20Android-3b82f6" alt="platforms: iOS | Android" />
  <img src="https://img.shields.io/badge/New%20Architecture-ready-16a34a" alt="New Architecture ready" />
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/react-native-liquid-glassmorphism?color=3b82f6" alt="MIT license" /></a>
  <a href="./CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs welcome" /></a>
  <a href="https://github.com/himanshu-lal4/react-native-liquid-glassmorphism/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22"><img src="https://img.shields.io/github/issues/himanshu-lal4/react-native-liquid-glassmorphism/good%20first%20issue?label=good%20first%20issues&color=7057ff" alt="good first issues" /></a>
</p>

Bring **Liquid Glass** to React Native — on **both iOS and Android** — with a single declarative component. Native `UIGlassEffect` on iOS 26, a real-time AGSL refraction shader on Android. Also known as *glassmorphism*, *frosted glass*, or the *iOS 26 glass effect*.

<table align="center">
  <tr>
    <td align="center">🍏&nbsp; <b>iOS 26</b> — native <code>UIGlassEffect</code></td>
    <td align="center">🤖&nbsp; <b>Android</b> — real-time AGSL refraction</td>
  </tr>
  <tr>
    <td align="center"><img src="https://github.com/himanshu-lal4/react-native-liquid-glassmorphism/releases/download/v0.1.0/reel-ios.gif" alt="React Native Liquid Glass demo reel running on iOS 26 with native UIGlassEffect" width="250" /></td>
    <td align="center"><img src="https://github.com/himanshu-lal4/react-native-liquid-glassmorphism/releases/download/v0.1.0/reel-android.gif" alt="React Native Liquid Glass demo reel running on Android with real-time AGSL refraction" width="250" /></td>
  </tr>
</table>

<p align="center"><em>The same <a href="./example"><code>example/</code></a> reel on both platforms — one component, identical API, custom shapes &amp; drifting glass lenses.</em></p>

On iOS 26 it renders Apple's native `UIGlassEffect`. On Android, where there is no system Liquid Glass, it reproduces the same optics in a real-time **AGSL refractive-lens shader**: it captures the backdrop, bends and magnifies it through a rounded-glass lozenge (edge refraction + chromatic dispersion + a mirrored edge reflection), and finishes with a Fresnel rim and tilt/touch-driven specular highlights.

iOS and Android are both complete — a single declarative API, interactive touch/tilt response, **custom shapes** (including concave SVG silhouettes), and an Expo config plugin. See the [Roadmap](#roadmap).

📖 **Docs site:** https://himanshu-lal4.github.io/react-native-liquid-glassmorphism

---

## What does this library do?

It renders a translucent **glass surface** whose backdrop is blurred, tinted, and **refracted** — the modern iOS 26 "Liquid Glass" look. You wrap your content in `<LiquidGlassView>`; the children render crisply on top while only the content *behind* the view is treated. On iOS 26 that's Apple's real glass material; on Android it's a physically-modelled refraction shader that runs every frame.

## How is it different from a blur view?

Most React Native "glass" is just a blur. This library actually **refracts** the backdrop and works on Android too:

| Capability | react-native-liquid-glassmorphism | expo-blur / react-native-blur | expo-glass-effect / @callstack/liquid-glass |
|---|---|---|---|
| Native iOS 26 Liquid Glass (`UIGlassEffect`) | ✅ | ❌ blur only | ✅ |
| Liquid Glass optics on **Android** | ✅ AGSL refraction shader | ❌ blur only | ❌ iOS-only |
| Real refraction / edge lensing (not just blur) | ✅ | ❌ | ✅ (iOS, OS-rendered) |
| Chromatic dispersion + Fresnel rim | ✅ (Android shader) | ❌ | OS-managed |
| Interactive (touch bloom + tilt specular) | ✅ | ❌ | Partial |
| Custom shapes (concave SVG silhouette) | ✅ | ❌ | ❌ |
| Graceful fallback on older OS | ✅ blur / tint | ✅ | ⚠️ iOS 26 only |
| Expo config plugin · New Architecture · TypeScript | ✅ | ✅ | ✅ |

See the [full comparison](https://himanshu-lal4.github.io/react-native-liquid-glassmorphism/react-native-blur-alternative/). *(Other libraries evolve quickly — check their current docs before deciding.)*

## Features

- 🍏 **Native Liquid Glass on iOS** (`UIGlassEffect` on iOS 26), with a `UIBlurEffect` fallback below iOS 26
- 🤖 **Android parity** via a per-frame AGSL refractive-lens shader (API 33+), graceful fallbacks below
- 🎛️ Declarative API — `variant`, `tintColor`, `intensity`, `borderRadius`, `interactive`, `refraction`, `thickness`
- ✨ **Interactive** glass — reacts to touch (bloom + optical magnification) and to device tilt (specular)
- 🔷 **Custom shapes** — circle, squircle, polygon, star, points, or arbitrary/concave SVG paths
- 🧊 `regular` (frosted) and `clear` (transparent) materials
- ⚡ New Architecture (Fabric) **and** old architecture
- 🟦 First-class TypeScript types · 📦 Expo config plugin

## Installation

```sh
npm install react-native-liquid-glassmorphism
# or
yarn add react-native-liquid-glassmorphism
# Expo (dev build / prebuild — not Expo Go):
npx expo install react-native-liquid-glassmorphism
```

This is a native module, so it needs a native build — it does **not** run in Expo Go. For Expo, use a [development build](https://docs.expo.dev/develop/development-builds/introduction/) / `expo prebuild`.

### Requirements

| Platform | Minimum | For the full effect |
| --- | --- | --- |
| iOS | iOS 15 (blur fallback) | **iOS 26 SDK / Xcode 26** (native Liquid Glass) |
| Android | API 24 (translucent fallback) | **API 33+** (AGSL refractive shader) |
| React Native | 0.83+ | New or old architecture |

## Usage

```tsx
import { LiquidGlassView } from 'react-native-liquid-glassmorphism';

<LiquidGlassView
  variant="regular"        // 'regular' | 'clear'
  tintColor="rgba(10,132,255,0.5)"
  interactive              // reacts to touch + device tilt
  borderRadius={24}
  style={{ padding: 16 }}
>
  <Text>Frosted glass content</Text>
</LiquidGlassView>
```

Children render crisply **on top** of the glass — only the backdrop is blurred/refracted.

## API — `<LiquidGlassView>`

Extends `ViewProps`. All props are optional.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `'regular' \| 'clear'` | `'regular'` | `regular` = adaptive frosted glass. `clear` = lighter, transparent glass for media. |
| `tintColor` | `ColorValue` | — | Tint over the backdrop. Use `rgba()` / 8-digit hex to control strength. |
| `intensity` | `number` (0–100) | `60` | Blur / material strength. On iOS 26 the OS manages the material (used only for the pre-26 fallback); on Android it scales the blur radius. |
| `interactive` | `boolean` | `false` | Reacts to touch (a specular bloom + optical magnification under the finger) and to device tilt (moving specular). iOS 26 interactive glass natively. |
| `borderRadius` | `number` (dp) | `0` | Corner radius of the glass surface. Ignored when `shape` is set. |
| `shape` | `LiquidGlassShape` | — | Custom silhouette — `circle`, `squircle`, `polygon`, `star`, explicit `points`, or an arbitrary (even **concave**) SVG `path`. See [Custom shapes](#custom-shapes). |
| `refraction` | `boolean` | `true` | **Android only** — enables the AGSL edge-refraction lens (API 33+). No-op on iOS (the OS renders refraction). |
| `thickness` | `number` (0–2) | `1` | **Android only** — "liquid volume": scales the refraction/lens depth. `0` = flat pane, `1` = default, up to `~2` = deep liquid lens. No-op on iOS (glass optics are OS-fixed). |

## Custom shapes

Give the glass any silhouette with the `shape` prop. The glass **lenses the backdrop through the shape** — it's a real optical silhouette, not just a clip. Analytic shapes are generated for you; you can also pass an arbitrary SVG path (concave shapes like a tab-bar notch included).

```tsx
<LiquidGlassView shape={{ type: 'circle' }} style={{ width: 96, height: 96 }} />
<LiquidGlassView shape={{ type: 'squircle', n: 4 }} />
<LiquidGlassView shape={{ type: 'polygon', sides: 6 }} />
<LiquidGlassView shape={{ type: 'star', points: 5, innerRatio: 0.5 }} />
<LiquidGlassView shape={{ type: 'points', points: [[0, 0], [1, 0], [0.5, 1]] }} />

// Arbitrary SVG path — e.g. a curved tab-bar dock with a center notch:
<LiquidGlassView
  shape={{ type: 'path', d: notchPathString, width: SCREEN_W, height: 96 }}
  style={{ width: SCREEN_W, height: 96 }}
/>
```

The shape is **stretched to fill the view's bounds** (`preserveAspectRatio="none"`), so size the view to the shape's aspect ratio to keep it undistorted. SVG paths support `M/L/H/V/C/S/Q/T/Z` (absolute + relative); elliptic arcs (`A`) aren't supported — use béziers.

## How it works

- **iOS** composites glass natively with `UIGlassEffect` (iOS 26); below 26 it falls back to `UIVisualEffectView` + `UIBlurEffect` bucketed by `intensity`. A custom `shape` masks the glass to the silhouette with a `CAShapeLayer`.
- **Android** has no system Liquid Glass, so each frame it: captures the view hierarchy behind the glass into a downscaled bitmap → GPU Gaussian blur → an **AGSL shader** that models a glass lozenge (SDF-derived surface normal → Snell-style edge refraction → chromatic dispersion → mirrored edge reflection → adaptive frost + vibrant tint → Fresnel rim + tilt/touch specular). Below API 33 it degrades to blur + tint; below API 31, to a translucent tint. A custom `shape` is rasterised into a **signed-distance-field texture** the shader samples, so lensing/rim/dispersion follow any silhouette.

## Example

A gallery app lives in [`example/`](./example) (Expo). It exercises every variant, tint, shape, the interactive touch/tilt response, and the `thickness` control.

```sh
cd example
npx expo run:ios      # or: npx expo run:android
```

## Expo

The native module is autolinked, so `expo prebuild` picks it up with no manual
setup. Optionally add the config plugin to your app config:

```json
{ "expo": { "plugins": ["react-native-liquid-glassmorphism"] } }
```

(It's a pass-through today — the effect degrades by OS version at runtime, so no
minimum-SDK, permission, or Info.plist changes are needed.)

## Troubleshooting

**I don't see any glass effect.** Put the glass over something visually interesting — a photo, gradient, or scrolling content. Over a flat solid color there's nothing to blur or refract.

**On iOS it looks like a plain blur.** The native `UIGlassEffect` needs the **iOS 26 SDK / Xcode 26**. Below that, the library falls back to a `UIBlurEffect` frosted look by design.

**On Android there's no refraction.** The AGSL shader needs **Android 13 / API 33+**. On API 31–32 you get `RenderEffect` blur + tint; below 31, a translucent tint. Also confirm `refraction` isn't set to `false`.

**It crashes / the component is blank in Expo Go.** This is a native module — it can't run in Expo Go. Use a [development build](https://docs.expo.dev/develop/development-builds/introduction/) or `expo prebuild`, then rebuild the app.

**My custom shape looks stretched.** The shape fills the view's bounds (`preserveAspectRatio="none"`). Size the view to the shape's aspect ratio.

## FAQ

### How do I add Liquid Glass to a React Native app?

Install `react-native-liquid-glassmorphism`, rebuild the native app (dev build / `expo prebuild`, not Expo Go), and wrap content in `<LiquidGlassView>`. See [Usage](#usage).

### Does it work on Android, or is Liquid Glass iOS-only?

Both. Apple's Liquid Glass is iOS-only at the system level, but this library reproduces the optics on Android with a per-frame AGSL refraction shader (API 33+), with blur/tint fallbacks below that.

### Does it need iOS 26?

For Apple's native `UIGlassEffect`, yes (iOS 26 SDK / Xcode 26). On iOS 15–25 it falls back to a `UIBlurEffect` frosted look automatically.

### Does it work with Expo?

Yes — with a development build or `expo prebuild`. It does **not** run in Expo Go (it's a native module).

### Does it support the New Architecture (Fabric)?

Yes. It's a native Fabric component (codegen), and the same delegate covers the old architecture too.

### How is it different from expo-blur / react-native-blur?

Those only **blur** the backdrop. This one blurs **and refracts** it (edge lensing, chromatic dispersion, Fresnel rim, interactive specular), plus native `UIGlassEffect` on iOS 26. See the [comparison](#how-is-it-different-from-a-blur-view).

### Can the glass be any shape?

Yes — `circle`, `squircle`, `polygon`, `star`, explicit `points`, or an arbitrary concave SVG `path`. See [Custom shapes](#custom-shapes).

### Does it support web?

Not yet — mobile-only (iOS + Android) for now. Web is on the [Roadmap](#roadmap).

## Roadmap

- [x] Expo config plugin (`app.plugin.js`)
- [x] Custom shapes — analytic (`circle`/`squircle`/`polygon`/`star`/`points`) **and** arbitrary/concave SVG `path`
- [ ] Web support (currently mobile-only)

## Contributing & community

Issues, ideas, and pull requests of every size are welcome — bug reports and docs improvements help just as much as features.

**New to the project?** Start with a [**good first issue**](https://github.com/himanshu-lal4/react-native-liquid-glassmorphism/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) — each one is scoped and has a starting point. See [CONTRIBUTING.md](./CONTRIBUTING.md) for local setup and the dev workflow.

- 🐛 [Report a bug](https://github.com/himanshu-lal4/react-native-liquid-glassmorphism/issues/new)
- 💡 [Request a feature](https://github.com/himanshu-lal4/react-native-liquid-glassmorphism/issues/new)
- 🌱 [Pick up a good first issue](https://github.com/himanshu-lal4/react-native-liquid-glassmorphism/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
- 💬 [Ask a question / share an idea](https://github.com/himanshu-lal4/react-native-liquid-glassmorphism/discussions)
- ⭐ Star the repo to help others discover it

## License

MIT © [Himanshu Lal](https://github.com/himanshu-lal4)
