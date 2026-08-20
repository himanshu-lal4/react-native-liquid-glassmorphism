# React Native Liquid Glass — for Android AND iOS

<p align="center"><code>react-native-liquid-glassmorphism</code></p>

<p align="center">
  <a href="https://www.npmjs.com/package/react-native-liquid-glassmorphism"><img src="https://img.shields.io/npm/v/react-native-liquid-glassmorphism?color=cb3837&logo=npm&logoColor=white" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/react-native-liquid-glassmorphism"><img src="https://img.shields.io/npm/dm/react-native-liquid-glassmorphism?color=cb3837&logo=npm&logoColor=white" alt="npm downloads" /></a>
  <img src="https://img.shields.io/badge/platforms-iOS%20%7C%20Android-3b82f6" alt="platforms: iOS | Android" />
  <img src="https://img.shields.io/badge/New%20Architecture-ready-16a34a" alt="New Architecture ready" />
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/react-native-liquid-glassmorphism?color=3b82f6" alt="MIT license" /></a>
  <a href="./CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs welcome" /></a>
  <a href="https://github.com/himanshu-lal4/react-native-liquid-glassmorphism/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22"><img src="https://img.shields.io/github/issues/himanshu-lal4/react-native-liquid-glassmorphism/good%20first%20issue?label=good%20first%20issues&color=7057ff" alt="good first issues" /></a>
  <a href="https://himanshu-lal4.github.io/react-native-liquid-glassmorphism/"><img src="https://img.shields.io/badge/docs-read%20the%20guides-3b82f6" alt="documentation" /></a>
</p>

<p align="center">
  📚 <b><a href="https://himanshu-lal4.github.io/react-native-liquid-glassmorphism/">Documentation &amp; guides</a></b> ·
  📦 <b><a href="https://www.npmjs.com/package/react-native-liquid-glassmorphism">Install from npm</a></b>
</p>

<p align="center">
  <a href="https://github.com/sponsors/himanshu-lal4"><img src="https://img.shields.io/badge/GitHub_Sponsors-EA4AAA?style=for-the-badge&logo=githubsponsors&logoColor=white" height="32" alt="Sponsor on GitHub" /></a>
  &nbsp;
  <a href="https://buymeacoffee.com/wrack"><img src="https://img.shields.io/badge/Buy_Me_a_Coffee-FFDD00?style=for-the-badge&logo=buymeacoffee&logoColor=black" height="32" alt="Buy Me a Coffee" /></a>
</p>

<p align="center"><sub>If this library saves you a native module, a ⭐ and a coffee keep it maintained.</sub></p>

<p align="center">
  <b>🤖 Works on Android too — not an iOS-only wrapper. 🍏</b><br/>
  <sub>Most React Native Liquid Glass libraries are iOS-only. This one renders real glass on <b>both</b> platforms from the same component.</sub>
</p>

Bring **Liquid Glass** to React Native — on **Android and iOS** — with a single declarative component. Apple's native `UIGlassEffect` on iOS 26, and a real-time **AGSL refraction shader** on Android 13+. Same `<LiquidGlassView>`, same props, no platform branching in your app code.

<sub><b>Also searched for as:</b> react native liquid glass · react native glassmorphism · react native frosted glass · react native glass effect · android liquid glass · liquid glass android react native · ios 26 glass react native · react native glass blur · react native backdrop blur · react native blur view alternative · expo liquid glass · AGSL glass shader.</sub>

<table align="center">
  <tr>
    <td align="center">🤖&nbsp; <b>Android</b> — AGSL smooth-min merge</td>
    <td align="center">🍏&nbsp; <b>iOS 26</b> — <code>UIGlassContainerEffect</code></td>
  </tr>
  <tr>
    <td align="center"><img src="https://github.com/himanshu-lal4/react-native-liquid-glassmorphism/releases/download/v1.1.0/merge-android.gif" alt="Two glass views merging into one liquid body on Android, rendered with an AGSL smooth-min shader" width="250" /></td>
    <td align="center"><img src="https://github.com/himanshu-lal4/react-native-liquid-glassmorphism/releases/download/v1.1.0/merge-ios.gif" alt="Two glass views merging into one liquid body on iOS 26 via UIGlassContainerEffect" width="250" /></td>
  </tr>
</table>

<p align="center"><em><b>Glass that merges.</b> Two views fuse into a single liquid body as they approach — on <b>both</b> platforms. iOS hands this to Apple's <code>UIGlassContainerEffect</code>; Android has no OS equivalent, so the bodies are smooth-min merged per pixel in our own AGSL shader. The upper pair is animated through a <a href="#glass-that-merges"><code>&lt;LiquidGlassContainer&gt;</code></a>; the lower one is a static <code>secondaryShape</code>.</em></p>

<p align="center">
  <em>The full <a href="./example"><code>example/</code></a> reel — presets, non-glass materials, custom shapes and drifting lenses — is on the
  <a href="https://github.com/himanshu-lal4/react-native-liquid-glassmorphism/releases/tag/v0.1.0">v0.1.0 release</a>.</em>
</p>

On iOS 26 it renders Apple's native `UIGlassEffect`. On Android, where there is no system Liquid Glass, it reproduces the same optics in a real-time **AGSL refractive-lens shader**: it captures the backdrop, bends and magnifies it through a rounded-glass lozenge (edge refraction + chromatic dispersion + a mirrored edge reflection), and finishes with a Fresnel rim and tilt/touch-driven specular highlights.

iOS and Android are both complete — a single declarative API, interactive touch/tilt response, **custom shapes** (including concave SVG silhouettes), and an Expo config plugin. See the [Roadmap](#roadmap).

📖 **Docs site:** https://himanshu-lal4.github.io/react-native-liquid-glassmorphism

---

## What does this library do?

It renders a translucent **glass surface** whose backdrop is blurred, tinted, and **refracted** — the modern iOS 26 "Liquid Glass" look. You wrap your content in `<LiquidGlassView>`; the children render crisply on top while only the content *behind* the view is treated. On iOS 26 that's Apple's real glass material; on Android it's a physically-modelled refraction shader that runs every frame.

## How is it different from a blur view?

Most React Native "glass" is just a blur. This library actually **refracts** the backdrop and works on Android too:

| Capability | react-native-liquid-glassmorphism | expo-blur / react-native-blur | expo-glass-effect / @callstack/liquid-glass | @uginy · react-native-android-liquid-glass |
|---|---|---|---|---|
| **Cross-view merging** (glass fuses on contact) | ✅ **both platforms** | ❌ | ⚠️ iOS only (`UIGlassContainerEffect`) | ❌ |
| Native iOS 26 Liquid Glass (`UIGlassEffect`) | ✅ | ❌ blur only | ✅ | ❌ own impl / Android-only |
| Liquid Glass optics on **Android** | ✅ AGSL refraction shader | ❌ blur only | ❌ iOS-only | ✅ |
| Real refraction / edge lensing (not just blur) | ✅ | ❌ | ✅ (iOS, OS-rendered) | ✅ |
| Chromatic dispersion + Fresnel rim | ✅ (Android shader) | ❌ | OS-managed | ✅ |
| Interactive (touch bloom + tilt specular) | ✅ | ❌ | Partial | Partial |
| Custom shapes (concave SVG silhouette) | ✅ | ❌ | ❌ | ❌ corner radius only |
| **No third-party native dependency** | ✅ own AGSL, any ABI | ✅ | ✅ | ⚠️ JitPack AAR, arm-only `.so` |
| Android floor | ✅ `minSdk` 24, tiered fallback | ✅ | — | ⚠️ Android 13+ / RN 0.85+ |
| Graceful fallback on older OS | ✅ blur / tint | ✅ | ⚠️ iOS 26 only | ⚠️ |
| Expo config plugin · New Architecture · TypeScript | ✅ | ✅ | ✅ | Partial |

See the [full comparison](https://himanshu-lal4.github.io/react-native-liquid-glassmorphism/react-native-blur-alternative/). *(Other libraries evolve quickly — check their current docs before deciding.)*

## Three rules that decide whether this works

Read these before the API. Nearly every "it looks broken" report is one of the three.

**1. There must be something detailed behind the glass.** Refraction bends the
backdrop — and a bent flat colour is the same flat colour. Over a solid
background the library correctly renders almost nothing, which reads as broken.
It needs high-frequency detail: a photo, text, a busy list, a gradient at
minimum. If you are evaluating the library, test it over an image first.

**2. `shape` wins over `borderRadius`.** When you pass a `shape`, `borderRadius`
is ignored entirely — the silhouette defines the geometry. Setting both and
wondering why the radius does nothing is the second most common report.

**3. Several props are Android-only no-ops.** On iOS 26 the OS owns the
material, so it exposes no knobs for these. They are safe to pass
unconditionally — they simply do nothing on iOS:

| Android only | iOS 26 equivalent |
| --- | --- |
| `thickness` (except `0`) · `refraction` | OS-fixed optics |
| `edgeReflectionStrength` | OS-rendered rim |
| `legibilityFloor` | use `variant="regular"`, `tintColor` or `dim` |
| `tilt` | OS-rendered specular |
| `paused` | OS owns the refresh |
| `intensity` | OS-managed (drives the pre-26 fallback only) |

`blurRadius` and `dim` **do** work on both. Reach for `blurRadius` over
`intensity` when you want the same units on each platform.

## Features

- 🫧 **Glass that merges** — two or more glass views fuse into one liquid body as they approach, **on both platforms**. iOS uses `UIGlassContainerEffect`; Android has no OS equivalent, so we smooth-min the bodies analytically in the shader
- 🍏 **Native Liquid Glass on iOS** (`UIGlassEffect` on iOS 26), with a `UIBlurEffect` fallback below iOS 26
- 🤖 **Android parity** via a per-frame AGSL refractive-lens shader (API 33+), graceful fallbacks below
- 🎛️ Declarative API — `variant`, `tintColor`, `intensity`, `borderRadius`, `interactive`, `refraction`, `thickness`
- ✨ **Interactive** glass — reacts to touch (bloom + optical magnification) and to device tilt (specular)
- 🔷 **Custom shapes** — circle, squircle, polygon, star, points, or arbitrary/concave SVG paths
- 🧊 `regular` (frosted) and `clear` (transparent) materials
- 🪟 **Also a blur view** — switch the glass layers off for a plain blur, a scrim, or a dimmed modal backdrop
- 🌫️ **Progressive edge blur** — `<ScrollEdgeBlurView>` fades scrolling content out under a header or tab bar, on both platforms
- 🎚️ **Presets** — six tuned materials (`navigationBar`, `floatingTabBar`, `cardOverMedia`, …) you can override per-prop
- 🔍 **Capability detection** — `useGlassSupport()` tells you which tier a device can render, without mounting anything
- ♿ **Accessibility-aware** — `accessibilityMode` honours Reduce Transparency and Reduce Motion on both platforms, and updates live
- 🛟 **Dev-time warnings** for the mistakes that otherwise fail silently, stripped from production builds
- ⚡ New Architecture (Fabric) **and** old architecture
- 🟦 First-class TypeScript types · 📦 Expo config plugin · 🧬 **zero runtime dependencies**

## Installation

```sh
npm install react-native-liquid-glassmorphism
# or
yarn add react-native-liquid-glassmorphism
# Expo (dev build / prebuild — not Expo Go):
npx expo install react-native-liquid-glassmorphism
```

This is a native module, so it needs a native build — it does **not** run in Expo Go. For Expo, use a [development build](https://docs.expo.dev/develop/development-builds/introduction/) / `expo prebuild`.

<details>
<summary>Installing from GitHub Packages (mirror)</summary>

This package is also mirrored to GitHub Packages as `@himanshu-lal4/react-native-liquid-glassmorphism`. Note that GitHub Packages requires authentication even for public packages, so installing from npm (above) is recommended for most users.

1. Create a GitHub [personal access token](https://github.com/settings/tokens) with the `read:packages` scope.
2. Add the scope routing and token to your project's `.npmrc`:

```ini
@himanshu-lal4:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

3. Install (only the `@himanshu-lal4` scope routes to GitHub — all other dependencies still come from npm):

```sh
npm install @himanshu-lal4/react-native-liquid-glassmorphism
```

4. Import from the mirrored name:

```ts
import { LiquidGlassView } from '@himanshu-lal4/react-native-liquid-glassmorphism';
```

</details>

### Requirements

| Platform | Minimum | For the full effect |
| --- | --- | --- |
| iOS | iOS 15 (blur fallback) | **iOS 26 SDK / Xcode 26** (native Liquid Glass) |
| Android | API 24 (translucent fallback) | **API 33+** (AGSL refractive shader) |
| React Native | 0.83+ | New or old architecture |

**Android build toolchain:** the AGSL `RuntimeShader` + `RenderNode` path needs a
recent toolchain — build with **compileSdk 34+** and a current NDK (tested with
**NDK `27.1.12297006`**). If a first build fails auto-installing the NDK, install
it once via the SDK Manager and rebuild.

**Android degradation matrix** (what actually renders per OS tier):

| Android tier | `tier` | Renders |
| --- | --- | --- |
| API 33+ | `refraction` | Full AGSL lens: blur → vibrancy → **edge refraction** → tint → specular |
| API 31–32 | `blur` | Blur + Canvas tint/specular (**no refraction lensing**) |
| < API 31 | `tint` | Translucent tint + rim only |

To find out which tier a device will run **before mounting anything**, call
[`getGlassCapabilities()`](#capability-detection). To confirm which one actually
rendered, handle [`onPipelineReady`](#events) — or read the same line from
logcat: `LiquidGlass: render tier=… shaderCompiled=…`.

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

> **`interactive` / `tilt` need children.** The touch & tilt effects are driven by
> the glass view's own touches, so foreground content must be a **child** of
> `<LiquidGlassView>` (not a sibling rendered over an `absoluteFill` glass). With
> no children they are a silent no-op — in a dev build you'll get a logcat warning
> explaining this.

**Readable chrome over `clear` glass.** `clear` faithfully transmits whatever is
behind it, which can make foreground icons/labels hard to read over busy content.
Use `legibilityFloor` for an adaptive veil behind the children (and `tintColor`
to hue it) instead of hand-rolling a scrim:

```tsx
<LiquidGlassView
  variant="clear"
  legibilityFloor={0.4}          // adaptive veil under the children
  tintColor="rgba(10,9,8,0.5)"
  edgeReflectionStrength={0.4}    // calm the rim echo over text
  style={styles.tabBar}
>
  {/* icons + labels stay readable */}
</LiquidGlassView>
```

## API — `<LiquidGlassView>`

Extends `ViewProps`. All props are optional.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `preset` | `GlassPresetName` | — | Start from a tuned material instead of dialling every knob. See [Presets](#presets). Any prop you pass explicitly wins over the preset. |
| `accessibilityMode` | `'auto' \| 'forceGlass' \| 'forceOpaque'` | `'auto'` | How the view responds to Reduce Transparency / Reduce Motion. `auto` renders an **opaque** surface when the platform asks for reduced transparency and drops `tilt` under Reduce Motion. Works on **both** platforms and updates live. See [Accessibility](#accessibility). |
| `variant` | `'regular' \| 'clear'` | `'regular'` | `regular` = adaptive frosted glass. `clear` = lighter, transparent glass for media. |
| `tintColor` | `ColorValue` | — | Tint over the backdrop. Use `rgba()` / 8-digit hex to control strength. |
| `intensity` | `number` (0–100) | `60` | Blur / material strength. On iOS 26 the OS manages the material (used only for the pre-26 fallback); on Android it scales the blur radius. `clear` deliberately blurs less than `regular` across the same scale — use `blurRadius` if you want an exact value. |
| `rim` | `boolean` | `true` | **Android only** — draw the bright glass edge. See [Not just glass](#not-just-glass--blur-scrim-overlay). |
| `specular` | `boolean` | `true` | **Android only** — draw the moving sheen and specular hotspot. |
| `dim` | `number` (0–1) | `0` | A flat dimming scrim over the backdrop, under the children — the modal-backdrop primitive. Works on **both** platforms. |
| `blurRadius` | `number` (dp) | — | An explicit blur radius, overriding whatever `intensity` would derive, and meaning the same thing on both variants. This is the knob to reach for when you want `clear` glass that is still properly blurred: `<LiquidGlassView variant="clear" blurRadius={16} />`. Useful range ~`0`–`30`. Works on **both** platforms, including on real Liquid Glass — UIKit exposes no radius on `UIGlassEffect`, so on iOS the backdrop is blurred underneath the glass and the glass refracts the already-blurred result. |
| `interactive` | `boolean` | `false` | Reacts to **touch** — a specular bloom + optical magnification under the finger. iOS 26 interactive glass natively. (Device-tilt specular is now the separate `tilt` prop.) |
| `tilt` | `boolean` | `false` | **Android only** — device-tilt specular driven by the gyro/accelerometer. Decoupled from `interactive` so you can have touch response **without** an always-on motion sensor; the sensor registers only while `tilt` is on. No-op on iOS. |
| `borderRadius` | `number` (dp) | `0` | Corner radius of the glass surface. Ignored when `shape` is set. |
| `shape` | `LiquidGlassShape` | — | Custom silhouette — `circle`, `squircle`, `polygon`, `star`, explicit `points`, or an arbitrary (even **concave**) SVG `path`. See [Custom shapes](#custom-shapes). |
| `secondaryShape` | `LiquidGlassShape` | — | A second glass body, smooth-min merged with `shape` so the two cling and fuse as they approach. Both share the primary's view-box, so author them as `path`/`points` shapes positioned within one box; two bounds-filling primitives merge concentrically. **Both platforms** — Android merges the distance fields natively, iOS gets a JS-computed merged outline. |
| `shapeSmoothing` | `number` (dp) | `0` | Blend radius for the `secondaryShape` merge. `0` is a hard union with a visible crease. The bridge forms when the surfaces are within ~`k/4` of the midpoint, so to fuse bodies `g` apart use roughly `2 × g`. `16`–`48` for bodies ~100dp across. **Both platforms.** |
| `refraction` | `boolean` | `true` | **Android only** — dials the AGSL edge-refraction lens strength up (~1.35×, API 33+). Lensing is intrinsic to the glass and never fully off; use `thickness={0}` for a flat pane. No-op on iOS (the OS renders refraction). |
| `thickness` | `number` (0–2) | `1` | **Android only** — "liquid volume": scales the refraction/lens depth. `0` = flat pane, `1` = default, up to `~2` = deep liquid lens. No-op on iOS (glass optics are OS-fixed). |
| `edgeReflectionStrength` | `number` (0–1) | `1` | **Android only** — strength of the edge-reflection band (the upside-down rim echo), **independent of `thickness`**. Lower it over text-heavy backdrops where the mirrored copy reads as noise. No-op on iOS. |
| `legibilityFloor` | `number` (0–1) | `0` | **Android only** — an adaptive veil drawn **under the foreground children** so chrome (icons/labels) stays readable over `clear` glass, without darkening the whole pane. Scales with the value and the backdrop brightness; hued by `tintColor`. `0` = off. No-op on iOS. |
| `paused` | `boolean` | `false` | **Android only** — suspend the per-frame backdrop capture without unmounting; the glass holds its last frame. Off-screen views pause automatically, so this is for the cases Android can't detect. See [Performance](#performance). No-op on iOS. |
| `frameStatsInterval` | `number` (ms) | `0` | **Android only** — how often to report frame timings via `onFrameStats`. `0` disables it completely: nothing is timed, accumulated or dispatched. A **development HUD** — ship it off. No-op on iOS. |
| `iridescence` | `number` (0–1) | `0` | **Android only** — rainbow shimmer at the rim, hue driven by the angle to the centre. Rides the same edge ramp as the lens, so it reads as light splitting at the edge rather than a colour overlay. `0.3` is already visible. No-op on iOS. |
| `grain` | `number` (0–~0.15) | `0` | **Android only** — film grain over the surface. A heavy blur flattens the backdrop into a gradient; a little noise is what makes it read as etched glass. Above ~0.15 it reads as noise. No-op on iOS. |
| `lightAngle` | `number` (radians) | `0` | **Android only** — rotates the built-in light direction. An **offset**, not an absolute bearing, so `0` keeps the tuned top-left key light. Drives the sheen, specular and inner shadow together. No-op on iOS. |
| `specularSharpness` | `number` | `1` | **Android only** — multiplier on the specular exponent. Higher is a tighter, harder hotspot; lower is satin. Useful range ~`0.25`–`4`. No-op on iOS. |
| `saturation` | `number` | `1` | **Android only** — multiplier on the backdrop vibrancy, applied **before** the tint. `0` gives a greyscale backdrop. Useful range ~`0`–`2`. No-op on iOS. |
| `brightness` | `number` | `1` | **Android only** — multiplier on backdrop luminance, before the tint. Unlike `dim` (a flat scrim on top) this grades what the glass transmits, so the edge and sheen keep their own brightness. Useful range ~`0.5`–`1.5`. No-op on iOS. |
| `magnification` | `number` | `1` | **Android only** — constant magnification of the backdrop through the lens centre. `1` samples 1:1; above 1 the glass reads as convex and enlarges what is behind it. Distinct from the transient touch magnifier `interactive` adds. Useful range ~`0.5`–`2`. No-op on iOS. |
| `ior` | `number` | `1.5` | **Android only** — index of refraction. `1.5` is window glass and reproduces the default look; `1` is vacuum (no bending, flat lens); `2.4` is roughly diamond. Related to `thickness` but not the same — `thickness` is how deep the glass is, `ior` is what it is made of. Useful range ~`1`–`2.5`. No-op on iOS. |
| `onPipelineReady` | `(e) => void` | — | Fires once per view with the tier that actually rendered. See [Events](#events). |
| `onError` | `(e) => void` | — | Fires when the view can't do what the props asked for. See [Events](#events). |
| `onFrameStats` | `(e) => void` | — | **Android only** — frame timings aggregated over each `frameStatsInterval` window. Never fires while that is `0`. See [Frame stats](#frame-stats). |

> **`secondaryShape` is for a fixed silhouette, not an animated one.** The merge
> happens on a signed-distance field baked on the CPU whenever the shape
> changes — measured at **~361ms** for a 340×190dp body on a Realme RMX3868.
> That is the right trade once, and completely the wrong one per frame:
> animating the gap drove a test screen to **1.6fps**. Set it and leave it. An
> analytic merge that can animate is a separate piece of work.

## Presets

Six tuned starting points, so the common cases don't need the whole prop table:

```tsx
import { LiquidGlassView, GlassPresets } from 'react-native-liquid-glassmorphism';

<LiquidGlassView preset="floatingTabBar" style={styles.tabBar} />

// Start from a preset and override a single value — explicit props always win.
<LiquidGlassView preset="cardOverMedia" legibilityFloor={0.5} />
```

| Preset | For |
| --- | --- |
| `navigationBar` | A translucent header with content scrolling under it. Square corners, shallow lens. |
| `floatingTabBar` | A detached, fully-rounded bar floating above content. Full thickness and a live rim. |
| `cardOverMedia` | A readable card over photography or video. `clear` glass plus a legibility veil. |
| `compactControl` | A chip, badge or small floating control. Small surfaces need small numbers. |
| `frosted` | Heavy and matte — a settings sheet or modal backdrop, where legibility beats transparency. Carries a little `grain`. |
| `crystal` | Thin, hard and deeply refracting. Decorative; not somewhere to put a paragraph. |

A preset is resolved in JS as `{ ...GlassPresets[preset], ...yourProps }`. The raw
map is exported as `GlassPresets` if you want to read, diff or extend the values.

## Capability detection

Branch **without mounting a view** — useful for deciding whether to render glass
at all, or to swap in a flat design on older devices:

```tsx
import {
  useGlassSupport,
  isLiquidGlassSupported,
  getGlassCapabilities,
} from 'react-native-liquid-glassmorphism';

function Panel() {
  const { tier, supportsRefraction } = useGlassSupport();
  if (tier === 'none') return <FlatPanel />;
  return <LiquidGlassView preset="cardOverMedia">…</LiquidGlassView>;
}
```

`getGlassCapabilities()` is pure `Platform` arithmetic — no native call, safe to
run before mount and in tests. It returns:

| Field | Meaning |
| --- | --- |
| `supported` | A native implementation exists on this platform. |
| `tier` | `'glass'` (real iOS 26 `UIGlassEffect`) · `'refraction'` (AGSL, Android 33+) · `'blur'` (iOS 15–25, Android 31–32) · `'tint'` (Android < 31) · `'none'`. |
| `osVersion` | Android API level, or the iOS major version — comparable with `>=` on both. |
| `supportsNativeGlass` | The glass is rendered by the OS, not by our shader. |
| `supportsBlur` · `supportsRefraction` | Whether the backdrop is really blurred / really lensed. |
| `supportsShapes` | Whether a custom `shape` gets the full glass treatment (below Android 33 the silhouette still clips, but as a path-clipped frost). |

## Performance

On Android the glass captures what is behind it once per frame, into its own
bitmap. That capture is the single most expensive thing the library does, and it
is what the knobs below are all about.

**Views that Android reports as off-screen pause themselves.** A screen pushed on
top of this one, an inactive tab, a backgrounded app — all stop capturing, and
re-capture on the way back. You do not need to wire anything up for those.

For the cases that signal cannot see — a screen a navigator keeps alive, a
carousel page waiting off to the side — pause it yourself:

```tsx
const isFocused = useIsFocused();          // e.g. @react-navigation/native

<LiquidGlassView paused={!isFocused} />
```

In rough order of what to reach for when frames drop:

1. **`paused`** on anything mounted but not being looked at. Biggest single win.
2. **Fewer instances.** Each glass view captures its own backdrop — ten of them
   on screen is ten full captures per frame. (Sharing one capture across views
   is [tracked here](https://github.com/himanshu-lal4/react-native-liquid-glassmorphism/issues/38).)
3. **`tilt={false}`** unless the surface really needs a motion-driven specular;
   it registers a sensor and repaints on its events.
4. **Simpler `shape`.** An arbitrary path rebuilds a signed-distance-field
   texture whenever the silhouette or the view's size changes.
5. **`thickness={0}`** for a flat pane where the lens isn't doing visible work.

On iOS none of this applies — `UIGlassEffect` is composited by the OS.

## Known limitations

Things this library genuinely does not do well, so you can find out here rather
than three days into an integration.

- **Each glass view captures its own backdrop.** Ten on screen is ten full
  software `rootView.draw()` calls per frame on Android. This is the ceiling on
  putting glass in a long `FlatList` today. Sharing one capture per frame across
  all views is [tracked in #38](https://github.com/himanshu-lal4/react-native-liquid-glassmorphism/issues/38).
- **Below Android 13 you are not getting Liquid Glass.** API 31–32 gets a
  `RenderEffect` blur with tint — no lensing, no dispersion, no rim reflection.
  Below API 31 it is a translucent tint only. The ladder is automatic and
  documented, but it is a real downgrade, not a subtle one.
- **GPU-backed surfaces cannot be captured.** Video players, `SurfaceView`,
  map views and some camera previews refuse a software draw, so the glass
  reuses its previous backdrop and reports `BACKDROP_CAPTURE_FAILED`. Glass over
  a playing video does not work on Android.
- **Elliptic arcs are not supported in `shape` paths.** `A` commands fail to
  parse and fall back to a rounded rectangle with `INVALID_SHAPE`. Export
  curves as cubic or quadratic béziers.
- **No Expo Go.** It is a native module. Development build or `expo prebuild`,
  always. This is true of every library that renders native glass.
- **iOS exposes no blur radius on `UIGlassEffect`.** `blurRadius` is honoured by
  blurring the backdrop *underneath* the glass, which then refracts the blurred
  result. It tracks the Android shader closely across 0–25 dp, but it is not the
  OS applying a radius.
- **Web is a non-glass fallback.** The tier reports `none`. This library is
  mobile-focused.
- **Merging caps at 8 bodies per container on Android**, and merges rounded
  rectangles rather than arbitrary `shape` silhouettes. iOS has neither limit,
  because the OS does the merge.
- **Android has no Reduce Transparency setting.** The accessibility degradation
  below uses high-contrast text as the closest available signal there, which is
  a proxy rather than the real preference.

## Accessibility

The glass is translucent, refracting and — with `tilt` — moving. That is exactly
what a user who has enabled **Reduce Transparency** or **Reduce Motion** has
asked not to see, so by default the library honours both.

```tsx
<LiquidGlassView accessibilityMode="auto" />   // the default
```

| Mode | Behaviour |
| --- | --- |
| `auto` *(default)* | Renders an **opaque** surface when the platform asks for reduced transparency; drops `tilt` under Reduce Motion. |
| `forceGlass` | Always renders glass, overriding the transparency preference. Still honours Reduce Motion. |
| `forceOpaque` | Always renders the opaque surface. |

**What each platform reports.** iOS uses Reduce Transparency directly. Android
has no equivalent setting, so the closest honest signal is **high-contrast
text** — someone who has asked for maximum text contrast is not well served by
text over a refracting backdrop. Reduce Motion is read on both.

**It is live.** The preference is re-read on change events *and* whenever the app
returns to the foreground — which is the case that actually matters, since users
toggle these in Settings, which backgrounds your app. There is no imperative
refresh call to remember.

**`interactive` is deliberately not suppressed** by Reduce Motion. It responds to
a touch the user just made, which is not the unbidden movement that setting is
about. `tilt` is suppressed, and because that is the prop the native side gates
sensor registration on, no motion sensor is registered at all.

### A note on `forceGlass`

It overrides a preference the user deliberately set, often for a reason that
matters to them. Only reach for it where the glass is decorative and something
else already carries the meaning — never for primary chrome or anything behind
text. The dev build warns once when you use it.

## Frame stats

Tuning the glass used to mean a gradle → adb → screenshot loop and judging cost
by eye. `onFrameStats` gives you a number.

```tsx
const [hud, setHud] = useState(null);

<LiquidGlassView
  frameStatsInterval={250}
  onFrameStats={({ nativeEvent }) => setHud(nativeEvent)}
/>
```

```ts
{ drawFps, totalMs, maxTotalMs, captureMs, shaderMs, tier, capturedWidth, capturedHeight }
```

**`frameStatsInterval` is a permission, not a cadence.** At `0` — the default —
nothing is timed, accumulated or dispatched, and no listener is attached. That
is why the interval is required rather than the handler being enough on its own.

**Read `maxTotalMs`, not `totalMs`, when hunting jank.** Frames inside a window
are averaged rather than sampled, so nothing is missed — but a single 40 ms
spike disappears into a 250 ms average, and that spike is the frame you care
about. `maxTotalMs` carries it.

**These are CPU-side timings** — the backdrop capture and the render-node and
uniform work. GPU shader execution is not visible from the view, so this
measures the cost the library controls, not total frame cost. `captureMs` is
normally the dominant term, and it scales with `capturedWidth × capturedHeight`.

**This is a development HUD. Ship it off.** The reporting is throttled and
cheap, but timing every frame is not free. The dev build warns once while it is
enabled.

## Glass that merges

Two or more glass views fuse into a single liquid body as they come close,
instead of stacking as separate panes. Wrap them and set `spacing`:

```tsx
import { LiquidGlassContainer, LiquidGlassView } from 'react-native-liquid-glassmorphism';

<LiquidGlassContainer spacing={40}>
  <LiquidGlassView style={{ width: 96, height: 96, borderRadius: 48 }} />
  <LiquidGlassView style={{ width: 96, height: 96, borderRadius: 48 }} />
</LiquidGlassContainer>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `spacing` | `number` (dp) | `0` | The distance at which children begin to merge. `0` disables merging — children render as ordinary separate glass. |

Any `<LiquidGlassView>` merges just by being a descendant; there is no per-child
prop and no special child component. Merging is a **relationship between
siblings**, so something has to define the group and the distance — that is what
the container is for.

**Move the children however you like.** Position, `transform`, layout animation —
the container reads each child's real on-screen geometry every frame, so an
animated merge costs a uniform upload rather than a rebuild. This is the
difference between it and `secondaryShape`, which bakes a distance field and is
therefore **static only**.

**iOS** hands this to `UIGlassContainerEffect` and gets out of the way — the OS
merges the children's glass itself. Below iOS 26 there is no such effect, so
children render as ordinary separate glass.

**Android** has no OS equivalent. The container renders one glass surface and
smooth-mins the children's rounded rectangles per pixel in AGSL, which is
analytic and therefore free to animate. Two limits follow from that:

- Bodies are **rounded rectangles**, taken from each child's size and
  `borderRadius`. A child using a custom `shape` is not merged.
- **At most 8** children merge, because the shader's uniform array needs a
  compile-time bound. Beyond that they render as ordinary glass and the dev
  build warns once — they never silently disappear.

The merged surface adopts the **material of the first body it merges**, since a
fused blob is one material by definition. Give the children the same `variant`
and `tintColor` unless you want to find out which one wins.

## Scroll edge blur

Content scrolling under a translucent header wants a *progressive* blur pinned
to the edge — strongest at the edge, dissolving into the content — not a
uniform pane. That is a different component, because it takes no children, has
no silhouette, tint or interaction, and never intercepts touches:

```tsx
import { ScrollEdgeBlurView } from 'react-native-liquid-glassmorphism';

<ScrollEdgeBlurView
  edge="top"
  maxBlurRadius={32}
  falloff={0.8}
  style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 120 }}
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `edge` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` | The edge the blur is anchored to. |
| `maxBlurRadius` | `number` (dp) | `24` | Blur radius at the anchored edge. **dp, not pixels** — a radius that means different things on different densities is a bug waiting to be filed. |
| `falloff` | `number` (0–1) | `1` | How far across the view the blur has fully dissolved. `1` ramps across the whole view. |

**On Android** it reads the same per-root backdrop capture the glass views
share, so adding one to a screen that already has glass costs no extra capture.
The ramp is an **opacity** ramp over a single blurred layer rather than a
per-pixel radius ramp — stacking N blurs at N radii would be closer to what iOS
does natively, at N times the cost, and at these radii the difference is not
visible against real content. Needs API 31+; below that it renders nothing.

**On iOS** it is a `UIVisualEffectView` masked by a `CAGradientLayer`. UIKit
exposes no continuous blur radius, so `maxBlurRadius` selects the nearest
discrete material — the closest equivalent, not a literal radius.

**On web** it renders an inert transparent view that holds its layout. There is
no honest way to fake a backdrop blur, and a translucent scrim over a header
that already has a background would look worse than nothing.

## Events

```tsx
<LiquidGlassView
  onPipelineReady={({ nativeEvent }) => setTier(nativeEvent.tier)}
  onError={({ nativeEvent: { code, message, fatal } }) => {
    if (fatal) setUseGlass(false);
    else console.warn(`[glass] ${code}: ${message}`);
  }}
/>
```

| Event | Payload | Notes |
| --- | --- | --- |
| `onPipelineReady` | `{ tier, osVersion, shaderCompiled, supportsNativeGlass }` | Fires **once per view**, after its first frame, with the tier that actually rendered. Fires on every platform — including the web fallback, with `tier: 'none'` — so a gate written against it resolves instead of hanging. |
| `onError` | `{ code, message, fatal }` | The view can't do what the props asked for. Each code fires at most once per view. |

`onPipelineReady` reports what **did** render; `getGlassCapabilities()` reports
what the device **can** render, and answers before anything has mounted. Use the
capability API to decide whether to render glass at all, and the event to confirm
what you got.

Error codes: `SHADER_COMPILE_FAILED`, `PIPELINE_DEGRADED`, `INVALID_SHAPE`,
`BACKDROP_CAPTURE_FAILED`, `GLASS_UNAVAILABLE`. Most are `fatal: false` — the
view recovered — but they always mean it isn't drawing what you asked for.
`BACKDROP_CAPTURE_FAILED` in particular is worth handling: `SurfaceView`,
`TextureView` and some video/map views can't be drawn to a software canvas, so
the glass behind them freezes on its last good frame. Everything is also logged
natively under the `LiquidGlass` tag, so a handler is optional.

## Development warnings

In `__DEV__` builds the library warns — once per problem, then never again — about
the things that would otherwise fail silently: non-finite values, a value passed on
the wrong scale (`intensity` is 0–100 while `thickness` is 0–2 and `legibilityFloor`
is 0–1), `borderRadius` combined with a `shape` that overrides it, an unknown
`preset` name, and props that do nothing on the current platform or OS version.
All of it is stripped from production bundles.

## Not just glass — blur, scrim, overlay

The glass is composed from layers you can switch off individually, so the same
component covers what you'd otherwise reach for a blur view, a translucent
`View`, or a dimmed modal backdrop to build. There's no `mode` to learn — just
turn off what you don't want.

```tsx
// A plain blur view. No edge, no highlights, no lensing.
<LiquidGlassView rim={false} specular={false} thickness={0} blurRadius={20} />

// A modal backdrop: blurred and dimmed, behind a sheet.
<LiquidGlassView
  style={StyleSheet.absoluteFill}
  rim={false}
  specular={false}
  thickness={0}
  blurRadius={24}
  dim={0.45}
/>

// Blur with a glass edge, but no moving highlights.
<LiquidGlassView specular={false} blurRadius={16} borderRadius={20} />

// The full material.
<LiquidGlassView variant="clear" borderRadius={20} />
```

| Prop | What it does | Platform |
| --- | --- | --- |
| `rim={false}` | Drops the bright glass edge | Android |
| `specular={false}` | Drops the moving sheen and specular hotspot | Android |
| `thickness={0}` | Drops edge refraction / lensing — a flat pane | Android |
| `dim={0…1}` | Adds a flat scrim under the children | **both** |
| `blurRadius` | Sets the blur in dp outright | **both** |

**All three "off" switches together are also the cross-platform signal.** With
`rim={false} specular={false} thickness={0}`, iOS stops rendering Liquid Glass
and returns a plain `UIBlurEffect` material instead — so a blur view is a blur
view on both platforms, not glass on one and blur on the other. In that mode
`blurRadius` picks the nearest UIKit material (they're discrete, so it's the
closest equivalent rather than a literal radius).

On **Liquid Glass** itself `blurRadius` is continuous on both platforms. Android
drives the `RenderEffect` radius directly; iOS blurs the backdrop underneath the
glass, holding a paused `UIViewPropertyAnimator` at a fraction of a blur so the
radius interpolates rather than snapping between UIKit's discrete materials.
Measured over 0–25dp against the Android shader, the two track closely — iOS
blurs marginally harder at each step and carries slightly *less* veil above
13dp.

`dim` is deliberately separate from `legibilityFloor`: that one is adaptive and
exists to keep chrome readable, `dim` is a constant design choice about the
surface.

> On the web fallback there is no real backdrop blur — React Native Web can't do
> it portably — so you get a translucent surface with the `rim` and `dim` you
> asked for, and no blur. Check `Platform.OS` if that matters to your design.

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

📐 **[ARCHITECTURE.md](./ARCHITECTURE.md)** goes deeper — the capture loop and the
HWUI invalidation trap, why the per-frame capture is deliberately not throttled,
the SDF texture design and the shattered-glass artifacts that drove it, the iOS 26
`cornerConfiguration` segfault, and how to symbolicate a native crash here.

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

### How is it different from react-native-liquid-glass (Expo) or @callstack/liquid-glass?

Those are thin wrappers over Apple's `UIGlassEffect`, so they are **iOS-26-only** — on Android they render nothing glass-like. This library drives the same native `UIGlassEffect` on iOS **and** reproduces the optics on Android 13+ with a real-time AGSL refraction shader, from one `<LiquidGlassView>`. It also supports [glass shape **merging**](https://himanshu-lal4.github.io/react-native-liquid-glassmorphism/react-native-glass-merging/) — neighbouring glass views fusing like liquid — which the wrappers don't expose. If your app is iOS-only and stock, the wrappers are fine; if you ship to Android too, that's the gap this library exists to close.

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

## Also by the same author

- **[@wrack/react-native-tour-guide](https://github.com/himanshu-lal4/react-native-tour-guide)** — spotlight app tours, walkthroughs, and coach marks for React Native. Auto shape-matching spotlight, smart auto-scroll, runs in Expo Go. [npm](https://www.npmjs.com/package/@wrack/react-native-tour-guide) · [docs](https://himanshu-lal4.github.io/react-native-tour-guide/)

## License

MIT © [Himanshu Lal](https://github.com/himanshu-lal4)
