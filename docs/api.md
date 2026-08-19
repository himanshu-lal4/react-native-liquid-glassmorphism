---
layout: page
title: "API Reference — LiquidGlassView Props, Presets and Types (iOS + Android)"
description: "Complete API reference for react-native-liquid-glassmorphism: every LiquidGlassView prop with defaults and per-platform behaviour on iOS and Android, the six material presets, custom shape types, capability detection helpers, events and error codes."
permalink: /api/
---

# API reference

Everything `react-native-liquid-glassmorphism` exports. Each prop notes whether it applies on **iOS**, **Android**, or both.

```tsx
import {
  LiquidGlassView,
  GlassPresets,
  GLASS_PRESET_NAMES,
  getGlassCapabilities,
  isLiquidGlassSupported,
  useGlassSupport,
} from 'react-native-liquid-glassmorphism';
```

`<LiquidGlassView>` extends `ViewProps`, so `style`, `onLayout`, accessibility props and the rest all work as usual. Children render crisply on top; only the backdrop behind the view is treated.

## Material props

| Prop | Type | Default | Platforms | Notes |
| --- | --- | --- | --- | --- |
| `preset` | `GlassPresetName` | — | both | A tuned starting point. Resolved as `{ ...preset, ...yourProps }`, so anything you pass explicitly wins. |
| `variant` | `'regular' \| 'clear'` | `'regular'` | both | `regular` is adaptive frosted glass that lightens dark backdrops to keep text legible. `clear` is lighter and largely transparent — for use over photos and video. |
| `tintColor` | `ColorValue` | — | both | Tint layered over the blurred backdrop. Use `rgba()` or 8-digit hex to control strength. |
| `intensity` | `number` 0–100 | `60` | both | Blur / material strength. On iOS 26 the OS manages the material, so this only drives the pre-26 fallback; on Android it scales the blur radius. |
| `blurRadius` | `number` (dp) | — | both | Explicit blur radius, overriding `intensity`. Useful range ~`0`–`30`; `0` is genuinely unblurred. |
| `dim` | `number` 0–1 | `0` | both | Flat dimming scrim over the backdrop, under the children. The modal-overlay primitive. |

### `intensity` vs `blurRadius`

`intensity` is a 0–100 abstraction whose mapping differs per variant — `clear` deliberately blurs far less than `regular`, so it spans a narrow range across the whole scale. `blurRadius` ignores that scaling and gives both variants the same units in dp. Reach for it when `intensity` is not giving you the control you want, especially on `clear` glass.

It is honoured on both platforms including real Liquid Glass: UIKit exposes no blur radius on `UIGlassEffect`, so on iOS the backdrop is blurred underneath the glass and the glass refracts the already-blurred result. Measured against the Android shader across 0–25 dp, the two track closely.

## Edge and light props

| Prop | Type | Default | Platforms | Notes |
| --- | --- | --- | --- | --- |
| `rim` | `boolean` | `true` | both | Draw the bright glass edge. |
| `specular` | `boolean` | `true` | both | Draw the moving sheen and specular hotspot. |
| `edgeReflectionStrength` | `number` 0–1 | `1` | **Android** | Strength of the mirrored "echo" band at the top/bottom rim. Independent of `thickness`, so you can keep a deep lens while calming the reflection over text-heavy backdrops. |

## Geometry props

| Prop | Type | Default | Platforms | Notes |
| --- | --- | --- | --- | --- |
| `borderRadius` | `number` (dp) | `0` | both | Ignored when `shape` is set. |
| `shape` | `LiquidGlassShape` | — | both | Custom silhouette. The backdrop is **lensed through** the shape, not clipped to it. |
| `thickness` | `number` 0–2 | `1` | both (`0`), **Android** (in between) | "Liquid volume" — scales refraction and lensing depth. `0` = flat pane, `1` = default, `~2` = deep lens. |
| `refraction` | `boolean` | `true` | **Android** (API 33+) | Dials the edge-refraction lens up (~1.35×). Lensing is intrinsic and never fully off — use `thickness={0}` for a flat pane. |

## Interaction props

| Prop | Type | Default | Platforms | Notes |
| --- | --- | --- | --- | --- |
| `interactive` | `boolean` | `false` | both | iOS 26 interactive `UIGlassEffect`; on Android a touch-following specular and optical magnification under the finger. |
| `tilt` | `boolean` | `false` | **Android** | Device-tilt specular from the gyro/accelerometer. Kept separate from `interactive` so you can have touch response without an always-on motion sensor — leaving it off saves battery on persistent chrome like tab bars. |

## Legibility and performance props

| Prop | Type | Default | Platforms | Notes |
| --- | --- | --- | --- | --- |
| `legibilityFloor` | `number` 0–1 | `0` | **Android** | Adaptive veil drawn *under the children only*, so icons and labels stay readable over `clear` glass without darkening the whole pane. Adapts to backdrop brightness, hued by `tintColor`. |
| `paused` | `boolean` | `false` | **Android** | Suspend the effect without unmounting; the glass holds its last frame. Views Android already reports as off-screen pause automatically — use this for cases that signal cannot see. |

## Events

| Event | Payload | Notes |
| --- | --- | --- |
| `onPipelineReady` | `{ tier, osVersion, shaderCompiled, supportsNativeGlass }` | Fires once per view after the first frame, reporting the tier that **actually** rendered. Fires on every platform, including the web fallback with `tier: 'none'`. |
| `onError` | `{ code, message, fatal }` | Fires when the view cannot do what the props asked. Each code fires at most once per view; most are non-fatal. |

To decide whether to mount a glass view *at all*, use `getGlassCapabilities()` — it answers before anything has committed. Use `onPipelineReady` to learn what a mounted view actually did.

## Plain blur mode

Turn off every glass signal to use this as a conventional backdrop blur — a drop-in for `BlurView`:

{% raw %}
```tsx
<LiquidGlassView rim={false} specular={false} thickness={0} blurRadius={20} />
```
{% endraw %}

On iOS that combination tells the library you do not want Liquid Glass at all, and it renders a plain `UIBlurEffect` material — picking the nearest discrete material to your radius — instead of `UIGlassEffect`.

## Presets
{: #presets }

`GlassPresets` is a frozen map of partial prop bags; `GLASS_PRESET_NAMES` lists the keys. A preset describes the **material**, never the silhouette or layout, so it never sets `shape`, `style` or `children`.

| Preset | variant | intensity | thickness | edgeReflection | legibilityFloor | borderRadius | For |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `navigationBar` | regular | 70 | 0.6 | 0.4 | 0.15 | 0 | A translucent header with content scrolling under it. Square corners, shallow lens — a deep one on a full-width bar just smears. |
| `floatingTabBar` | regular | 65 | 1 | 1 | 0.2 | 28 | A detached, fully-rounded tab bar above content. Full thickness and a live rim, so it reads as a physical object. |
| `cardOverMedia` | clear | 45 | 1.2 | 0.7 | 0.35 | 24 | A readable card over photography or video. `clear` keeps the artwork recognisable; the veil buys back text contrast. |
| `compactControl` | clear | 50 | 0.7 | 1 | 0.25 | 20 | A small pill — a chip, a badge, a floating control. |
| `frosted` | regular | 85 | 0.4 | 0.3 | 0 | 20 | Heavy, matte, almost opaque — a settings sheet or modal backdrop, where legibility beats see-through. |
| `crystal` | clear | 30 | 1.8 | 1 | 0.1 | 24 | Thin, hard and deeply refracting. Decorative — a hero element, not somewhere to put a paragraph. |

{% raw %}
```tsx
// Start from a preset, override one value.
<LiquidGlassView preset="floatingTabBar" borderRadius={32} />
```
{% endraw %}

## Shape types

{% raw %}
```tsx
{ type: 'circle' }
{ type: 'squircle', n?: number }                        // 2 = ellipse, 4 = classic squircle (default), higher is boxier
{ type: 'polygon', sides: number, rotation?: number, cornerRadius?: number }
{ type: 'star', points?: number, innerRatio?: number }  // default 5 points, 0.5 ratio; smaller is spikier
{ type: 'points', points: Array<[number, number]> }     // any coordinate space; the bounding box becomes the view-box
{ type: 'path', d: string, width: number, height: number }
```
{% endraw %}

`path` supports `M/L/H/V/C/S/Q/T/Z`, absolute and relative. **Elliptic arcs (`A`) are not supported** — express curves as cubic or quadratic béziers. Concave shapes, such as a tab-bar notch, are fully supported.

The shape is stretched to fill the view's bounds, so size the view to the shape's aspect ratio to avoid distortion. On Android the silhouette becomes a signed-distance-field texture the AGSL shader samples (API 33+; below that it degrades to a path-clipped frost). On iOS the glass is masked with a `CAShapeLayer`.

## Capability detection

{% raw %}
```tsx
import { getGlassCapabilities, isLiquidGlassSupported, useGlassSupport } from 'react-native-liquid-glassmorphism';

const caps = getGlassCapabilities();  // { tier, osVersion, supportsBlur, supportsRefraction, ... }
const ok = isLiquidGlassSupported();  // boolean
const live = useGlassSupport();       // the hook form, for components
```
{% endraw %}

`GlassTier` is `'glass' | 'refraction' | 'blur' | 'tint' | 'none'`.

## Platform behaviour

| Platform | Tier | What renders |
| --- | --- | --- |
| iOS 26+ | `glass` | Apple's native `UIGlassEffect` — regular/clear, interactive, tint, corner radius, shape mask |
| iOS 15–25 | `blur` | `UIBlurEffect` material bucketed by `intensity` |
| Android 13+ (API 33+) | `refraction` | Per-frame backdrop capture → Gaussian blur → AGSL refractive-lens shader, SDF shapes |
| Android 12 (API 31–32) | `blur` | `RenderEffect` blur + tint |
| Android < 12 | `tint` | Translucent tint fallback |

## Error codes

| Code | Meaning |
| --- | --- |
| `SHADER_COMPILE_FAILED` | The AGSL would not compile; the view fell back a tier. Non-fatal. |
| `PIPELINE_DEGRADED` | The OS version cannot run the requested tier. |
| `INVALID_SHAPE` | The `shape` path could not be parsed; fell back to a rounded rectangle. |
| `BACKDROP_CAPTURE_FAILED` | A view behind the glass refused a software draw, so the previous backdrop is reused. |
| `GLASS_UNAVAILABLE` | iOS below 26, so a `UIBlurEffect` material is standing in for `UIGlassEffect`. |

## See also

- [Getting started]({{ '/getting-started/' | relative_url }}) · [Recipes]({{ '/recipes/' | relative_url }}) · [Troubleshooting]({{ '/troubleshooting/' | relative_url }})
- [iOS 26 Liquid Glass]({{ '/ios-26-liquid-glass/' | relative_url }}) · [Android Liquid Glass]({{ '/android-liquid-glass/' | relative_url }})
- [Library comparison]({{ '/best-react-native-liquid-glass-library/' | relative_url }}) · [FAQ]({{ '/faq/' | relative_url }})

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "TechArticle",
  "headline": "API Reference — LiquidGlassView Props, Presets and Types",
  "description": "Complete API reference for react-native-liquid-glassmorphism: every LiquidGlassView prop with defaults and per-platform behaviour on iOS and Android, material presets, custom shape types, capability detection helpers, events and error codes.",
  "author": { "@type": "Person", "name": "Himanshu Lal", "url": "https://github.com/himanshu-lal4" },
  "about": { "@type": "SoftwareApplication", "name": "react-native-liquid-glassmorphism", "applicationCategory": "DeveloperApplication", "operatingSystem": "iOS, Android" },
  "keywords": "LiquidGlassView props, react native liquid glass api, react native glass effect props, liquid glass android props, AGSL shader props, glass presets react native"
}
</script>
