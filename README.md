# react-native-liquid-glassmorphism

Bring **iOS 26 Liquid Glass** to React Native — on **both iOS and Android** — with a single declarative component.

On iOS 26 it renders Apple's native `UIGlassEffect`. On Android, where there is no system Liquid Glass, it reproduces the same optics in a real-time **AGSL refractive-lens shader**: it captures the backdrop, bends and magnifies it through a rounded-glass lozenge (edge refraction + chromatic dispersion + a mirrored edge reflection), and finishes with a Fresnel rim and tilt/touch-driven specular highlights.

> Status: pre-`0.1.0`. iOS is complete; Android is a full physically-based implementation. The Expo config plugin and a production performance pass are still in progress — see [Roadmap](#roadmap).

## Features

- 🍏 **Native iOS 26 Liquid Glass** (`UIGlassEffect`), with a `UIBlurEffect` fallback below iOS 26
- 🤖 **Android parity** via a per-frame AGSL refractive-lens shader (API 33+), graceful fallbacks below
- 🎛️ Declarative API — `variant`, `tintColor`, `intensity`, `borderRadius`, `interactive`, `refraction`, `thickness`
- ✨ **Interactive** glass — reacts to touch (bloom + optical magnification) and to device tilt (specular)
- 🧊 `regular` (frosted) and `clear` (transparent) materials
- ⚡ New Architecture (Fabric) **and** old architecture
- 🟦 First-class TypeScript types

## Installation

```sh
npm install react-native-liquid-glassmorphism
# or
yarn add react-native-liquid-glassmorphism
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
| `borderRadius` | `number` (dp) | `0` | Corner radius of the glass surface. |
| `refraction` | `boolean` | `true` | **Android only** — enables the AGSL edge-refraction lens (API 33+). No-op on iOS (the OS renders refraction). |
| `thickness` | `number` (0–2) | `1` | **Android only** — "liquid volume": scales the refraction/lens depth. `0` = flat pane, `1` = default, up to `~2` = deep liquid lens. No-op on iOS (glass optics are OS-fixed). |

## How it works

- **iOS** composites glass natively with `UIGlassEffect` (iOS 26); below 26 it falls back to `UIVisualEffectView` + `UIBlurEffect` bucketed by `intensity`.
- **Android** has no system Liquid Glass, so each frame it: captures the view hierarchy behind the glass into a downscaled bitmap → GPU Gaussian blur → an **AGSL shader** that models a rounded-glass lozenge (SDF-derived surface normal → Snell-style edge refraction → chromatic dispersion → mirrored edge reflection → adaptive frost + vibrant tint → Fresnel rim + tilt/touch specular). Below API 33 it degrades to blur + tint; below API 31, to a translucent tint.

## Example

A gallery app lives in [`example/`](./example) (Expo). It exercises every variant, tint, shape, the interactive touch/tilt response, and the `thickness` control.

```sh
cd example
npx expo run:ios      # or: npx expo run:android
```

## Roadmap

- [ ] Expo config plugin (`app.plugin.js`) for zero-config prebuild
- [ ] Android performance pass (shared/throttled backdrop capture)
- [ ] Arbitrary / SVG custom shapes

## License

MIT © [Himanshu Lal](https://github.com/himanshu-lal4)
