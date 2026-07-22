---
title: "Liquid Glass on Android in React Native — I refracted the backdrop with a real-time AGSL shader"
published: false
tags: reactnative, android, graphics, shaders
---

> **TL;DR** — React Native has no built-in Liquid Glass on Android. The library [`react-native-liquid-glassmorphism`](https://github.com/himanshu-lal4/react-native-liquid-glassmorphism) reproduces it: every frame it captures the backdrop, blurs it with `RenderEffect`, then runs a hand-written **AGSL refraction shader** (`RuntimeShader`, Android 13 / API 33+) that bends the backdrop through a modelled glass slab — edge refraction, chromatic dispersion, a Fresnel rim, and a device-tracking specular. On iOS 26 the same `<LiquidGlassView>` uses Apple's native `UIGlassEffect`. This post walks the Android pipeline end to end.

**Key takeaways**

- Android gives you only two primitives for this — `RenderEffect.createBlurEffect` and `RuntimeShader` (AGSL). Everything Apple's material does for free, you model yourself.
- What makes it read as *glass* and not *blur*: refracting the backdrop through a surface normal, chromatic dispersion, a mirrored edge echo, and a Fresnel + specular rim.
- The performance work is in **backdrop capture + dirty-tracking**, not the shader.
- The full lens needs Android 13 / API 33+ (and the iOS 26 SDK on iOS); it degrades gracefully below both.

When Apple shipped Liquid Glass with iOS 26, it landed as a *system material*. You add `UIGlassEffect` to a view and the OS does the rest: it captures what's behind you, blurs it, warps it through a modelled slab of glass, and paints a specular highlight that tracks the device. Real edge refraction, chromatic dispersion at the rim, an inverted echo of the content just outside the frame. Not a blur — a lens.

Android has none of this. There is no glass material, no `View`, no Compose modifier. What Android gives you, from API 33 (Android 13), is two lower-level primitives: `RenderEffect.createBlurEffect` (a Gaussian blur you can attach to a render node) and `RuntimeShader` (a way to run **AGSL** — Android Graphics Shading Language, Skia's dialect of SkSL — per pixel as a render effect). That's it. Everything Apple's material does for free, you have to model yourself.

This is the story of doing exactly that inside a React Native view — `react-native-liquid-glassmorphism`. The whole Android renderer is one Kotlin `ReactViewGroup` subclass plus one AGSL string. I'll walk the pipeline back-to-front, the same order iOS composites in, and explain *why* each stage exists — because most of the interesting decisions are about what goes wrong when you skip a step.

## The pipeline, in one breath

Every frame the backdrop changes, the view does this:

1. **Capture** the hierarchy behind it into a downscaled bitmap (software canvas).
2. **Skip repaint** if the backdrop didn't actually change (dirty hash).
3. Draw that bitmap into a hardware `RenderNode` and attach a **blur** `RenderEffect`.
4. **Chain** an AGSL `RuntimeShader` onto the blur — that's where the optics live.
5. Let the React children draw crisply on top as normal `ViewGroup` children.

Stages 3–4 are the whole trick, but stages 1–2 are where the performance and the bugs are.

## Capturing the backdrop without recording yourself

The shader needs pixels to bend. Those pixels are *whatever is behind the glass* — sibling views, the screen underneath. So on every `onPreDraw`, the view rasterises the view tree behind it into a `Bitmap`:

```kotlin
override fun onPreDraw(): Boolean {
  if (isCapturing || width == 0 || height == 0) return true
  captureBackdrop()
  ...
}
```

The obvious approach — record the live view tree into a `RenderNode` and read it back — deadlocks. The recorded tree keeps references back to *your own* node, and HWUI stack-overflows walking it. So instead the capture goes through a plain software `Canvas` backed by a bitmap, which rasterises immediately with no live references:

```kotlin
canvas.save()
val scale = 1f / captureScale
canvas.scale(scale, scale)
canvas.translate(-(locThis[0] - locRoot[0]).toFloat(), -(locThis[1] - locRoot[1]).toFloat())
// draw() short-circuits while capturing so we never record ourselves.
isCapturing = true
try {
  root.draw(canvas)
} finally {
  isCapturing = false
}
canvas.restore()
```

Two details matter here. First, the translate offsets the root by the glass view's window position, so the bitmap holds exactly the region behind *this* view. Second — the important one — the view guards its own `draw()`:

```kotlin
override fun draw(canvas: Canvas) {
  if (isCapturing) return
  super.draw(canvas)
}
```

Without that guard, `root.draw(canvas)` would recurse into the glass view itself, which would try to capture, which would draw the root again — infinite feedback, a hall of mirrors. The `isCapturing` flag makes the glass invisible to its own capture pass.

## The 2× downscale, and why it's not free detail

The capture isn't full resolution. It's downscaled by a constant:

```kotlin
private val captureScale = 2
```

Half-resolution capture is a deliberate trade. It's cheaper to rasterise, cheaper to upload to the GPU, and — conveniently — it pre-softens the image before the blur even runs, so you can get away with a lighter blur radius and keep more structure for the lens to bend. The cost is honest: fine text in the backdrop loses crispness before it's refracted. For a *backdrop* being blurred and warped anyway, that's invisible; if you ever wanted a near-lossless lens you'd pay for `captureScale = 1`. (Worth flagging: the code comment next to this constant discusses values `3` and `6`, leftovers from earlier tuning — the shipped value is `2`, which the docs and the render path both use.)

## Dirty tracking: the difference between free and 60fps-forever

Here's the trap with `onPreDraw` capture: if you `invalidate()` yourself every time you capture, you've built a perpetual-motion machine. Capturing schedules a draw, the draw triggers `onPreDraw`, which captures, which schedules a draw... 60fps forever, on a completely static screen, burning battery for nothing.

The fix is to only repaint when the backdrop *actually changed*. Comparing every pixel each frame would cost as much as the redraw. Instead the view hashes a sparse 6×5 grid of sampled pixels:

```kotlin
private fun backdropHash(): Int {
  val bmp = captured ?: return 0
  var hash = 1
  val cols = 6; val rows = 5
  for (r in 0 until rows) {
    val y = (h - 1) * r / (rows - 1)
    for (c in 0 until cols) {
      val x = (w - 1) * c / (cols - 1)
      hash = hash * 31 + bmp.getPixel(x, y)
    }
  }
  return hash
}
```

Then in `onPreDraw`, repaint only on a hash change (or the first good frame):

```kotlin
val hash = backdropHash()
if (!haveGoodCapture || hash != lastBackdropHash) {
  lastBackdropHash = hash
  haveGoodCapture = true
  postInvalidateOnAnimation()
}
```

On a static screen the hash settles after one frame and the loop stops dead. When something behind the glass scrolls or animates, *that* invalidation fires `onPreDraw`, the hash differs, and exactly one fresh frame is drawn. The `postInvalidateOnAnimation()` (rather than a plain `invalidate()` from inside the draw pass) matters too: an `invalidate()` issued mid-`onPreDraw` gets unreliably coalesced by HWUI, and a dropped repaint is exactly what would let a black first-capture stick on screen as a ghost overlay.

## Blur → shader: the RenderEffect chain

Now the GPU stage. The captured bitmap is recorded into a hardware `RenderNode`, and a `RenderEffect` is attached to it. The effect is built back-to-front to mirror iOS's compositing order — blur first, then the material shader chained on top:

```kotlin
private fun buildEffect(w: Int, h: Int): RenderEffect {
  val radius = GlassParams.blurRadiusPx(intensity, variantClear, density)
  val blur = RenderEffect.createBlurEffect(radius, radius, Shader.TileMode.CLAMP)

  val shader = glassShader ?: run { shaderActive = false; return blur }

  shader.setInputShader("sdf", ...)
  shader.setFloatUniform("iResolution", w.toFloat(), h.toFloat())
  shader.setFloatUniform("iCorner", ...)
  shader.setFloatUniform("iLens", GlassParams.lensStrengthPx(...) * thickness)
  // ... vibrancy, tint, specular, tilt, touch uniforms ...

  val material = RenderEffect.createRuntimeShaderEffect(shader, "content")
  shaderActive = true
  return RenderEffect.createChainEffect(material, blur)
}
```

`createChainEffect(material, blur)` means: run `blur` first, feed its output into the `content` sampler of the shader. Note the blur is deliberately *light* (a few dp, scaled by `intensity`, and `clear` gets a fraction of that) — a heavy blur destroys the very structure the lens needs to bend. The shader is compiled **once**, at construction, and reused every frame; recompiling AGSL per frame would stutter visibly:

```kotlin
private val glassShader: RuntimeShader? = try {
  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) RuntimeShader(GLASS_AGSL) else null
} catch (_: Throwable) { null }
```

If the SDK is below 33, or the AGSL fails to compile, `glassShader` is null and `buildEffect` returns the bare blur. That's the first fallback tier, and it happens without a branch anywhere else in the code.

## The shader: modelling a slab of glass, one pixel at a time

This is the heart of it. The `content` sampler is the blurred backdrop; the shader's job is to figure out, for each output pixel, *where in that backdrop to sample from* so the result looks like light bending through a rounded slab of glass.

**Step 1 — Signed distance field.** Treat the view as a rounded rectangle and compute the exact signed distance to its edge:

```glsl
float sdRoundRect(float2 p, float2 b, float r) {
  float2 q = abs(p) - b + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}
```

The SDF is the backbone: it gives distance-to-edge for free, and its gradient gives the surface normal. From `d` the shader derives a `rim` ramp (0 in the interior → 1 at the very edge, across a band `lensW` px wide).

**Step 2 — Surface normal by differentiating the SDF.** The direction of steepest distance change is the outward normal — which way the glass surface tilts:

```glsl
float gx = sdRoundRect(p + float2(e,0.0), b, iCorner) - sdRoundRect(p - float2(e,0.0), b, iCorner);
float gy = sdRoundRect(p + float2(0.0,e), b, iCorner) - sdRoundRect(p - float2(0.0,e), b, iCorner);
float2 n2 = float2(gx, gy) / (length(float2(gx,gy)) + 1e-5);
```

**Step 3 — Inward refraction.** This is the signature move. Take a steep power of the rim ramp so almost all the bending happens in the outer ring, then push the sample coordinate *inward* along the normal:

```glsl
float bend = rim * rim * axisFade;
float2 disp = n2 * bend * iLens * edgeGuard;
float2 uv = magCoord - disp - reflDisp;
```

Because the shader samples from further *inside* the backdrop near the rim, content behind the edge is magnified outward and appears to wrap around it — like the fat edge of a water droplet. The centre, where `rim` is ~0, stays clear. `iLens` is the edge displacement in pixels, scaled by the `thickness` prop. `axisFade` deserves a note: the SDF gradient collapses along a shape's medial axis (the ridge equidistant from two edges), and on a short pill the top and bottom lens rings meet there and the normal flips, producing a hard seam. Fading the lens to zero where the gradient magnitude drops kills the seam and leaves flat clear glass down the middle.

**Step 4 — Chromatic dispersion.** Real glass splits wavelengths at the rim. Sample R, G, B at slightly offset coordinates along the normal:

```glsl
float2 ca = n2 * bend * iLens * 0.018;
src.r = content.eval(clamp(uv + ca, float2(0.0), iResolution - 1.0)).r;
src.g = content.eval(clamp(uv,      float2(0.0), iResolution - 1.0)).g;
src.b = content.eval(clamp(uv - ca, float2(0.0), iResolution - 1.0)).b;
```

The `0.018` factor is tiny on purpose. iOS UI glass shows almost no prismatic rainbow; crank the split and it reads as a chromatic-aberration *artefact*, not glass.

**Step 5 — The mirrored edge band.** Look at a glass pill on iOS and you'll see an upside-down echo of the content just outside it, folded back along the top and bottom. That's a second, broader displacement band at the rim (`reflDisp` above, scaled independently by the `edgeReflectionStrength` prop). Verified against iOS 26 side-by-side, the OS band is *broad and soft* — a thin band reads as a hard streak, so this one spans roughly a third of the surface with a squared falloff.

**Step 6 — Vibrancy, then adaptive frost.** Glass over-saturates what it transmits, so boost saturation while preserving luma, then lift only *dark* backdrop toward neutral so foreground text stays legible — never a milky fill:

```glsl
float luma = dot(src, half3(0.2126, 0.7152, 0.0722));
half3 col = half3(luma) + (src - half3(luma)) * iSat;
float adapt = clamp(iLift + (1.0 - luma) * iAdapt, 0.0, 0.5);
col = mix(col, half3(1.0), adapt);
```

**Step 7 — Rim, Fresnel, specular, and the touch/tilt terms.** A clean even bright rim outline (independent of lighting, so it never clumps into blobs), a gentle Fresnel term, a broad diagonal sheen band, and a small specular hotspot whose light direction is driven by the gravity sensor when `tilt` is on:

```glsl
float rimLine = 1.0 - smoothstep(0.0, 3.0, -d);
float fres = pow(1.0 - N.z, 3.0);
float3 L = normalize(float3(-0.5 + iTilt.x * 1.5, -0.7 + iTilt.y * 1.5, 0.8));
float spec = pow(clamp(dot(N, L), 0.0, 1.0), 10.0);
```

And the interactive touch magnifier — press and the glass optically zooms *toward* your finger without the element changing size, exactly as iOS presses lens harder rather than resizing:

```glsl
float2 td = coord - iTouch;
float tFall = exp(-dot(td, td) / (tmr * tmr));
float2 magCoord = coord - td * (iTouchAmt * tFall * 0.30);
```

One subtlety I'll call out because it bit me: an `edgeGuard = smoothstep(0.0, 12.0, -d)` tapers *all* refraction to zero across the outermost ~12px. Displacement peaks right at the rim, which is exactly where it magnifies sub-pixel normal noise into radial "cracked glass" hairlines. A thin calm bevel there erases the fringe; the crisp rim line still draws the edge.

## Being honest about the constraints

- **API 33+ for the full lens.** `RuntimeShader` only exists from Android 13. That's the top tier.
- **API 31–32:** `RenderEffect` blur exists, but no runtime shader, so you get blur + a Canvas-drawn tint and specular — no refraction.
- **Below API 31:** a translucent tint with a rim outline, and that's all.
- **`minSdkVersion` is 24**, so it installs and renders *something* everywhere; only the lens needs 33. The view logs its actual tier once (`render tier=agsl|blur|tint`) so you can tell "flat because fallback" from "flat because misconfigured" straight from `adb logcat -s LiquidGlass`.
- **The 2× capture** trades backdrop crispness for cost, per above.
- **Performance:** the dirty hash means a static screen costs nothing after the first frame, and the shader compiles once. I'm deliberately *not* quoting fps numbers — I don't have a rigorous benchmark, and made-up frame rates help no one.

The result isn't Apple's material — it's a model of it, tuned by eye against the real thing. But on a mid-range Android phone, over a photo or a scrolling feed, it reads as glass, not blur. That was the whole goal.

## FAQ

**Does React Native support Liquid Glass on Android?**
Not natively — Android has no system Liquid Glass material. `react-native-liquid-glassmorphism` adds it by capturing the backdrop and running a real-time AGSL refraction shader (`RuntimeShader`) on Android 13 / API 33+, with graceful fallbacks below that.

**What Android version do I need for Liquid Glass in React Native?**
API 33+ (Android 13) for the full refraction lens. API 31–32 falls back to blur + a Canvas tint/specular; below API 31, a translucent tint. `minSdkVersion` is 24, so it installs and renders *something* everywhere.

**Is this just a blur view?**
No. A blur softens the backdrop in place; this *refracts* it — displacing the backdrop through a modelled glass surface normal, with chromatic dispersion, a mirrored edge echo, and a Fresnel + specular rim. It's a lens, not a blur.

**How is it different from expo-blur or @react-native-community/blur?**
Those are blur-only. This renders real Liquid Glass optics (refraction) on Android, *and* Apple's native `UIGlassEffect` on iOS 26 — one `<LiquidGlassView>` component, both platforms.

**Does react-native-liquid-glassmorphism work in Expo Go?**
No — it's a native module, so it needs a dev build / `expo prebuild`. It ships an Expo config plugin to make that setup one line.

**What does it do on iOS?**
On iOS 26 the same component composites Apple's native `UIGlassEffect`; below iOS 26 it falls back to `UIBlurEffect`. Full details and the per-OS fallback matrix are in the [docs](https://himanshu-lal4.github.io/react-native-liquid-glassmorphism/android-liquid-glass/).

---

If you want to try it or read the source:

- **npm:** `npm install react-native-liquid-glassmorphism`
- **GitHub:** https://github.com/himanshu-lal4/react-native-liquid-glassmorphism
- **Docs:** https://himanshu-lal4.github.io/react-native-liquid-glassmorphism/

And if you build onboarding into your app, my other library — [`@wrack/react-native-tour-guide`](https://github.com/himanshu-lal4/react-native-tour-guide) — does spotlight tours and coach marks with auto shape-matching, and runs in Expo Go.
