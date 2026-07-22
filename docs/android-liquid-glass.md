---
layout: page
title: "Android Liquid Glass in React Native — AGSL Refraction Shader (API 33+)"
description: "How to get Apple-style Liquid Glass on Android in React Native. A real-time AGSL RuntimeShader reproduces the iOS 26 optics — edge refraction, chromatic dispersion, mirrored edge reflection, Fresnel rim, touch and tilt specular — with documented fallbacks below Android 13."
permalink: /android-liquid-glass/
---

# Android Liquid Glass in React Native

Android has **no system Liquid Glass**. Apple ships `UIGlassEffect` on iOS 26; Google ships nothing equivalent — Android's platform toolkit gives you `RenderEffect.createBlurEffect` (a blur) and `RuntimeShader` (a programmable AGSL shader), but no glass material.

`react-native-liquid-glassmorphism` closes that gap by **rebuilding the optics from first principles** in a per-frame AGSL shader: it captures the backdrop behind the view, blurs it on the GPU, and then *refracts* it through a modelled glass lozenge. This is the library's genuinely rare capability — most React Native "glass" on Android is a flat blur.

{% raw %}
```bash
npm install react-native-liquid-glassmorphism
# yarn add react-native-liquid-glassmorphism
# Expo (dev build / prebuild — not Expo Go):
npx expo install react-native-liquid-glassmorphism
```
{% endraw %}

## Does Android have Liquid Glass?

Not at the OS level, and not as a `View`, material, or Compose modifier. What Android *does* have, from Android 13 (API 33 / Tiramisu) onward, is `android.graphics.RuntimeShader` — a way to run **AGSL** (Android Graphics Shading Language, a Skia dialect of SkSL) as a `RenderEffect` on a hardware `RenderNode`.

That's the primitive this library builds on. The glass is not a system effect being enabled; it is a shader that models glass and runs every frame the backdrop changes.

## How does the Android glass shader actually work?

The pipeline mirrors the order iOS composites glass in, back to front:

1. **Backdrop capture.** Each `onPreDraw`, the view rasterises the hierarchy *behind* it into a downscaled `Bitmap` (a 2× downscale — cheaper to draw and it pre-softens the blur). The view short-circuits its own `draw()` while capturing, so it never records itself into its own backdrop.
2. **Dirty tracking.** A sparse sampled hash (a 6×5 grid of pixels) of the capture is compared frame to frame. If the backdrop hasn't changed, nothing is repainted — there's no self-sustaining 60 fps capture→invalidate loop on a static screen. When content behind scrolls or animates, the hash differs and exactly one fresh frame is drawn via `postInvalidateOnAnimation()`.
3. **GPU blur.** The captured bitmap is drawn into a hardware `RenderNode` and a `RenderEffect.createBlurEffect` is attached. The blur is deliberately **light** (3–12 dp, scaled by `intensity`; `clear` gets 0.2× of that) — heavy blur destroys the detail the lens needs to bend.
4. **AGSL material shader.** A `RuntimeShader`, compiled once and reused, is chained onto the blur with `RenderEffect.createChainEffect`. That's where the actual optics happen.
5. **Children draw crisply on top**, as normal `ViewGroup` children.

### What the AGSL shader computes per pixel

- **Signed distance field.** For the default rounded rectangle, an analytic `sdRoundRect` gives the exact distance to the edge. For a custom `shape`, the silhouette is rasterised on the CPU into an SDF texture (plus a precomputed normal field and a full-resolution anti-aliased coverage mask) that the shader samples.
- **Surface normal + medial-axis fade.** The gradient of the distance field is the outward surface normal. Where that gradient collapses — along the shape's medial axis, the ridge equidistant from two edges — the lens is faded out, so short/pill shapes get flat clear glass in the middle instead of a hard seam.
- **Edge refraction.** The sample coordinate is pulled *inward* along the normal, weighted by a steep power of the rim ramp. Because the shader samples from further inside, content behind the rim is magnified outward and appears to **wrap the edge** — the signature Liquid Glass lensing. Almost all displacement happens in the outer ring; the centre stays clear.
- **Mirrored edge reflection.** A broad, soft band at the rim folds the sample back on itself, producing the upside-down "echo" iOS shows at the top and bottom of a glass pill. It spans roughly a third of the surface each side with a squared falloff — a thin band reads as a hard streak, not liquid.
- **Chromatic dispersion.** R, G and B are sampled at slightly split offsets along the normal at the rim. Kept *very* subtle (a 0.018 factor) — real iOS UI glass shows almost no prismatic rainbow, and a large split reads as an artefact.
- **Vibrancy + adaptive frost.** Glass over-saturates what it transmits, so luma-preserving saturation is applied, then a thin adaptive frost lifts only *dark* backdrop toward neutral so text stays legible. Never a milky fill.
- **Fresnel rim + specular.** A clean, even bright rim outline (independent of lighting, so it never clumps), a gentle Fresnel term, a broad diagonal sheen band, a small moving specular hotspot, and a soft inner shadow on the edge opposite the light.
- **Touch and tilt.** With `interactive`, a radial bloom plus a local optical magnification toward the finger — the element keeps its size, the glass just lenses harder under the press. With `tilt`, the light direction and sheen band are driven by the gravity/accelerometer sensor.
- **Edge guard.** All refraction tapers to zero across the outermost ~12 px. Displacement peaks at the rim, where it would otherwise magnify sub-pixel normal noise into radial "cracked glass" hairlines.

## What are the Android requirements?

| Android tier | What renders |
| --- | --- |
| **API 33+** (Android 13+) | Full AGSL lens: blur → vibrancy → **edge refraction** → dispersion → tint → rim/specular |
| API 31–32 (Android 12) | `RenderEffect` blur + Canvas tint/specular — **no refraction lensing** |
| Below API 31 | Translucent tint + rim only |

The library's `minSdkVersion` is **24**, so it installs and renders something sensible everywhere; only the *lens* requires API 33.

**Build toolchain.** The `RuntimeShader` + `RenderNode` path needs a recent toolchain — build with **compileSdk 34+** and a current NDK (tested with NDK `27.1.12297006`). If a first build fails auto-installing the NDK, install it once via the SDK Manager and rebuild.

**Confirming which tier ran.** The view logs its render tier once, so you can tell "flat because fallback" from "flat because misconfigured":

{% raw %}
```
adb logcat -s LiquidGlass
# LiquidGlass: render tier=agsl shaderCompiled=true sdk=34
```
{% endraw %}

`tier` is `agsl`, `blur`, or `tint`.

## How do I use it?

{% raw %}
```tsx
import { Text, StyleSheet } from 'react-native';
import { LiquidGlassView } from 'react-native-liquid-glassmorphism';

export function GlassPill() {
  return (
    <LiquidGlassView
      variant="regular"
      tintColor="rgba(10,132,255,0.5)"
      intensity={60}
      borderRadius={28}
      interactive
      tilt
      thickness={1.3}
      style={styles.pill}
    >
      <Text style={styles.label}>Liquid Glass on Android</Text>
    </LiquidGlassView>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 26,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  label: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
```
{% endraw %}

Put the glass over something visually interesting — a photo, gradient, or scrolling content. Over a flat solid colour there is nothing to blur or refract.

> **`interactive` and `tilt` need children.** Both effects are driven by the glass view's own touches, so foreground content must be a **child** of `<LiquidGlassView>`, not a sibling rendered over an `absoluteFill` glass. With no children they're a silent no-op (a dev build logs a warning explaining this).

## Which props are Android-only?

These four have no effect on iOS, where the OS fixes the glass optics — they're safe to set unconditionally:

| Prop | Type | Default | What it does on Android |
| --- | --- | --- | --- |
| `tilt` | `boolean` | `false` | Device-tilt specular from the gravity/accelerometer sensor. The sensor is registered **only while this is `true`**, so leaving it off saves battery on persistent chrome (tab/nav bars). |
| `refraction` | `boolean` | `true` | Dials the edge-refraction lens strength up (~1.35×). Note that lensing is intrinsic to the material and never fully off — use `thickness={0}` for a genuinely flat pane. |
| `thickness` | `number` (0–2) | `1` | "Liquid volume" — scales refraction and lens depth. `0` = flat glass pane (blur + tint only), `1` = default, up to `~2` = a deep, heavily-refracting lens. |
| `edgeReflectionStrength` | `number` (0–1) | `1` | Strength of the mirrored rim echo, **independent of `thickness`**. Lower it over text-heavy backdrops where the inverted copy reads as noise. |
| `legibilityFloor` | `number` (0–1) | `0` | An adaptive veil drawn **under the foreground children** so icons and labels stay readable over `clear` glass, without darkening the whole pane. Scales with backdrop brightness and is hued by `tintColor`. |

### Readable chrome over `clear` glass

`clear` faithfully transmits whatever is behind it, which can make foreground icons and labels hard to read over busy content. Use `legibilityFloor` instead of hand-rolling a scrim:

{% raw %}
```tsx
<LiquidGlassView
  variant="clear"
  legibilityFloor={0.4}
  tintColor="rgba(10,9,8,0.5)"
  edgeReflectionStrength={0.4}
  style={styles.tabBar}
>
  {/* icons + labels stay readable */}
</LiquidGlassView>
```
{% endraw %}

## Can the Android glass be a custom shape?

Yes — and the shape is a real **optical silhouette**, not a clip. The path is rasterised into a signed-distance-field texture that the shader samples, so lensing, rim, and dispersion all follow the outline, including concave shapes:

{% raw %}
```tsx
<LiquidGlassView shape={{ type: 'circle' }} style={{ width: 96, height: 96 }} />
<LiquidGlassView shape={{ type: 'squircle', n: 4 }} />
<LiquidGlassView shape={{ type: 'polygon', sides: 6 }} />
<LiquidGlassView shape={{ type: 'star', points: 5, innerRatio: 0.5 }} />
<LiquidGlassView shape={{ type: 'points', points: [[0, 0], [1, 0], [0.5, 1]] }} />

// Arbitrary SVG path — e.g. a concave tab-bar notch:
<LiquidGlassView
  shape={{ type: 'path', d: notchPath, width: DOCK_W, height: DOCK_H }}
  style={{ width: DOCK_W, height: DOCK_H }}
/>
```
{% endraw %}

The shape is stretched to fill the view's bounds (`preserveAspectRatio="none"`), so size the view to the shape's aspect ratio. SVG paths support `M/L/H/V/C/S/Q/T/Z` (absolute and relative); elliptic arcs (`A`) aren't supported — express curves as béziers. A [full notched tab bar recipe]({{ '/recipes/' | relative_url }}) is in the recipes page.

## FAQ

### Does Android have a built-in Liquid Glass effect?

No. Apple's Liquid Glass is an iOS 26 system material with no Android equivalent. Android provides `RenderEffect` (blur) and `RuntimeShader` (AGSL) as primitives; this library uses them to reproduce the optics itself.

### What Android version is required?

The full refractive lens needs **Android 13 / API 33+**, where `RuntimeShader` is available. On API 31–32 you get `RenderEffect` blur plus tint and specular, and below API 31 a translucent tint with a rim. The library's `minSdkVersion` is 24, so it always renders something.

### Why does the Android glass look flat?

Three common causes: the device is below API 33 (check `adb logcat -s LiquidGlass` for `tier=`); `thickness` is set to `0`; or the glass is over a flat solid colour, where there is nothing to bend. Note that `refraction={false}` does not flatten the pane — it only reduces the lens strength; use `thickness={0}` for a truly flat pane.

### Does the shader hurt performance or battery?

The view only repaints when the captured backdrop actually changes, so a static screen costs nothing after the first frame. The backdrop is captured at half resolution and the shader is compiled once and reused. The motion sensor is registered only while `tilt` is `true` — leave it off for persistent chrome like nav and tab bars.

### Does it work with Jetpack Compose or plain Android views?

This package is a React Native library — it ships a Fabric component (`LiquidGlassmorphismView`) plus a view manager, consumed from JavaScript as `<LiquidGlassView>`. It is not published as a standalone Compose or Android-view artifact.

## See also

- [Getting started]({{ '/getting-started/' | relative_url }})
- [iOS 26 Liquid Glass & UIGlassEffect]({{ '/ios-26-liquid-glass/' | relative_url }})
- [Expo Liquid Glass setup]({{ '/expo-liquid-glass/' | relative_url }})
- [React Native glassmorphism vs Liquid Glass]({{ '/react-native-glassmorphism/' | relative_url }})
- [An expo-blur alternative]({{ '/expo-blur-alternative/' | relative_url }})
- [Recipes]({{ '/recipes/' | relative_url }}) · [FAQ]({{ '/faq/' | relative_url }})
- [GitHub repo]({{ site.repo_url }}) · [npm]({{ site.npm_url }})

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "React Native Liquid Glass — Android",
  "alternateName": "react-native-liquid-glassmorphism",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Android 13 (API 33) or later for the full AGSL refraction shader; Android 5.0 (API 24) minimum with blur and tint fallbacks",
  "description": "Apple-style Liquid Glass on Android for React Native, rendered by a real-time AGSL RuntimeShader that captures the backdrop and refracts it through a modelled glass lozenge — edge refraction, chromatic dispersion, mirrored edge reflection, Fresnel rim, and touch/tilt specular — with documented fallbacks below Android 13.",
  "programmingLanguage": ["TypeScript", "Kotlin", "AGSL"],
  "license": "https://opensource.org/licenses/MIT",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  "author": { "@type": "Person", "name": "Himanshu Lal", "url": "https://github.com/himanshu-lal4" },
  "downloadUrl": "https://www.npmjs.com/package/react-native-liquid-glassmorphism",
  "codeRepository": "https://github.com/himanshu-lal4/react-native-liquid-glassmorphism",
  "keywords": "android liquid glass, liquid glass on android, react native android glass, agsl shader, runtimeshader, rendereffect, android glassmorphism, android refraction shader"
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "Does Android have a built-in Liquid Glass effect?",
      "acceptedAnswer": { "@type": "Answer", "text": "No. Apple's Liquid Glass is an iOS 26 system material with no Android equivalent. Android provides RenderEffect for blur and RuntimeShader for AGSL shaders as primitives; react-native-liquid-glassmorphism uses them to reproduce the optics itself in a per-frame refractive-lens shader." } },
    { "@type": "Question", "name": "What Android version is required for Liquid Glass in React Native?",
      "acceptedAnswer": { "@type": "Answer", "text": "The full refractive lens needs Android 13 / API 33 or later, where RuntimeShader is available. On API 31 to 32 you get RenderEffect blur plus tint and specular, and below API 31 a translucent tint with a rim. The library's minSdkVersion is 24, so it always renders something." } },
    { "@type": "Question", "name": "Why does the Android liquid glass look flat?",
      "acceptedAnswer": { "@type": "Answer", "text": "Usually one of three causes: the device is below API 33 (check adb logcat -s LiquidGlass for the render tier), thickness is set to 0, or the glass sits over a flat solid colour where there is nothing to bend. Setting refraction to false does not flatten the pane — it only reduces lens strength; use thickness={0} for a truly flat pane." } },
    { "@type": "Question", "name": "Does the Android glass shader hurt performance or battery?",
      "acceptedAnswer": { "@type": "Answer", "text": "The view only repaints when the captured backdrop actually changes, so a static screen costs nothing after the first frame. The backdrop is captured at half resolution and the AGSL shader is compiled once and reused. The motion sensor is registered only while the tilt prop is true, so leaving tilt off saves battery on persistent chrome such as nav and tab bars." } }
  ]
}
</script>
