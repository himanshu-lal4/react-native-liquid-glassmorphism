---
layout: page
title: "Troubleshooting"
description: "Fixes for glass not appearing, no refraction on Android, Expo Go issues, blurry or black views, unreadable text over glass, and performance."
permalink: /troubleshooting/
---

# Troubleshooting

Most reports come down to one of five things: the app was not rebuilt, it is running in Expo Go, the OS is below the tier you expected, there is nothing behind the glass to refract, or the view has no size.

Start here: attach `onPipelineReady` and log what actually rendered.

{% raw %}
```tsx
<LiquidGlassView
  onPipelineReady={(e) => console.log('glass tier:', e.nativeEvent)}
  onError={(e) => console.warn('glass error:', e.nativeEvent)}
  style={{ width: 200, height: 120 }}
/>
```
{% endraw %}

`tier` tells you which path the view really took — `glass`, `refraction`, `blur`, `tint` or `none`. Almost every question below is answered by that one value.

## The glass does not appear at all

**Did you rebuild the native app?** This is a native module, not a JS package. After installing you must rebuild — `pod install` and a fresh run for iOS, a fresh Gradle build for Android. A Metro reload is not enough, and this is by far the most common cause.

**Are you in Expo Go?** Expo Go cannot load custom native modules, so the component renders as a plain view. Use a development build or `expo prebuild`. There is no workaround — every React Native library that touches native glass has this constraint. See [Expo setup]({{ '/expo-liquid-glass/' | relative_url }}).

**Does the view have a size?** `<LiquidGlassView>` has no intrinsic dimensions. With no `style` width/height, no flex, and no children forcing a size, it lays out at zero and you see nothing. Give it explicit dimensions while debugging.

**Is there anything behind it?** The effect treats the *backdrop*. Over a flat background colour, correctly-working glass looks almost like a flat panel — there is nothing to bend. Put a photo or some text behind it to confirm.

## There is no refraction on Android

Check the tier. If it reports `blur` or `tint` rather than `refraction`:

- **Android 12 or below.** The AGSL shader needs `RuntimeShader`, which is Android 13 / API 33+. Android 12 gets blur + tint; below that, a translucent tint. This is expected and automatic.
- **`SHADER_COMPILE_FAILED` in `onError`.** The shader would not compile on that GPU and the view fell back a tier. Non-fatal, but please [open an issue]({{ site.repo_url }}/issues) with the device and Android version.
- **`thickness={0}`.** That is a flat pane by definition. Raise it toward `1`.

If the tier *is* `refraction` but the effect looks flat, the backdrop may simply be low-contrast — refraction is only visible where there is detail to bend. Try it over a photo.

## The effect looks different on iOS and Android

Some of this is intentional. iOS 26 hands rendering to Apple's `UIGlassEffect`, and the OS owns the optics — so `thickness`, `edgeReflectionStrength`, `legibilityFloor`, `tilt` and `refraction` are Android-only knobs with no iOS equivalent. `intensity` is also OS-managed on iOS 26 and only drives the pre-26 fallback.

For the values that *do* apply on both, use `blurRadius` rather than `intensity` — it is in the same dp units on both platforms and tracks closely across 0–25 dp.

## Text over clear glass is unreadable

`clear` faithfully transmits whatever is behind it, which is the point, and it makes icons and labels hard to read over busy content. On Android, `legibilityFloor` adds an adaptive veil **under the children only**, so chrome stays readable without darkening the whole pane:

{% raw %}
```tsx
<LiquidGlassView variant="clear" legibilityFloor={0.4} edgeReflectionStrength={0.4}>
  {/* icons and labels stay readable */}
</LiquidGlassView>
```
{% endraw %}

On iOS, use `variant="regular"` (which adapts for legibility itself), a `tintColor` with alpha, or `dim`.

## A custom shape is not rendering

**`INVALID_SHAPE` in `onError`** means the path could not be parsed and the view fell back to a rounded rectangle. The usual cause is an **elliptic arc** — `A` commands are not supported. Convert arcs to cubic or quadratic béziers; most vector editors can export paths that way.

Also check that `width` and `height` on a `path` shape describe the coordinate space the `d` string was authored in, not the view's on-screen size. And remember the shape stretches to fill the view's bounds, so size the view to the shape's aspect ratio or it will look distorted.

Below Android API 33 shapes degrade to a path-clipped frost rather than true lensing.

## The backdrop looks stale or is a solid block

`BACKDROP_CAPTURE_FAILED` means a view behind the glass refused a software draw, so the previous backdrop is being reused. The usual culprits are other GPU-backed surfaces — video players, `SurfaceView`, map views, some camera previews. These cannot be captured into the backdrop on Android; put the glass over ordinary views, or accept the fallback.

## Performance is poor / the app drops frames

The glass captures what is behind it once per frame, which is the single most expensive thing it does. Options, in order of impact:

1. **Pause views that are mounted but not visible.** Android automatically pauses views it reports as off-screen — behind a pushed screen, on an inactive tab, in a backgrounded app. For cases that signal cannot see, such as a screen kept alive in a navigator stack or an off-screen carousel page, set `paused`.
2. **Do not stack glass on glass.** Each layer is another capture and shader pass.
3. **Drop `tilt`** on persistent chrome — it registers a motion sensor for as long as the view is mounted.
4. **Lower `blurRadius`** before lowering anything else.
5. **Shrink the glass area.** Cost scales with pixels covered, so a full-screen glass layer is the expensive case.

## It does not work on web

The library is mobile-focused. On web the tier reports `none` and you get a non-glass fallback, so `onPipelineReady` still resolves rather than hanging.

## Still stuck?

[Open an issue]({{ site.repo_url }}/issues) with the `onPipelineReady` payload, the OS version, the device, and whether you are on Expo or bare React Native. That payload usually identifies the problem immediately.

## FAQ

### Why is Liquid Glass not showing in my React Native app?

Most often the native app was not rebuilt after installing — this is a native module, so a Metro reload is not enough. The next most common causes are running in Expo Go (which cannot load native modules), a view with no width or height, or an OS below the required version. Log `onPipelineReady` to see which tier actually rendered.

### Why is there no refraction on Android?

The AGSL refraction shader requires Android 13 (API 33) or newer. On Android 12 the view falls back to blur plus tint, and below that to a translucent tint. Check the `tier` reported by `onPipelineReady` — if it says `blur` on Android 13+, look for a `SHADER_COMPILE_FAILED` error.

### Does Liquid Glass work in Expo Go?

No. Expo Go cannot load custom native modules. Use a development build or run `expo prebuild`. This applies to every React Native library that renders native glass.

### Why does my custom glass shape not render?

The most common cause is an elliptic arc (`A`) in the SVG path, which is not supported — convert it to cubic or quadratic béziers. An unparseable path reports `INVALID_SHAPE` via `onError` and falls back to a rounded rectangle.

### How do I improve Liquid Glass performance?

Set `paused` on glass views that are mounted but not visible, avoid stacking glass on glass, leave `tilt` off for persistent chrome, lower `blurRadius`, and reduce the on-screen area the glass covers.

## See also

- [API reference]({{ '/api/' | relative_url }}) · [Getting started]({{ '/getting-started/' | relative_url }})
- [Android Liquid Glass]({{ '/android-liquid-glass/' | relative_url }}) · [iOS 26 Liquid Glass]({{ '/ios-26-liquid-glass/' | relative_url }})
- [Expo setup]({{ '/expo-liquid-glass/' | relative_url }}) · [FAQ]({{ '/faq/' | relative_url }})

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "Why is Liquid Glass not showing in my React Native app?",
      "acceptedAnswer": { "@type": "Answer", "text": "Most often the native app was not rebuilt after installing, since this is a native module and a Metro reload is not enough. Other common causes are running in Expo Go, which cannot load native modules, a view with no width or height, or an OS below the required version. Log onPipelineReady to see which tier actually rendered." } },
    { "@type": "Question", "name": "Why is there no refraction on Android?",
      "acceptedAnswer": { "@type": "Answer", "text": "The AGSL refraction shader requires Android 13 (API 33) or newer. On Android 12 the view falls back to blur plus tint, and below that to a translucent tint. Check the tier reported by onPipelineReady, and if it says blur on Android 13 or later look for a SHADER_COMPILE_FAILED error." } },
    { "@type": "Question", "name": "Does Liquid Glass work in Expo Go?",
      "acceptedAnswer": { "@type": "Answer", "text": "No. Expo Go cannot load custom native modules. Use a development build or run expo prebuild. This applies to every React Native library that renders native glass." } },
    { "@type": "Question", "name": "Why does my custom glass shape not render?",
      "acceptedAnswer": { "@type": "Answer", "text": "The most common cause is an elliptic arc (A command) in the SVG path, which is not supported. Convert it to cubic or quadratic beziers. An unparseable path reports INVALID_SHAPE via onError and falls back to a rounded rectangle." } },
    { "@type": "Question", "name": "How do I improve React Native Liquid Glass performance?",
      "acceptedAnswer": { "@type": "Answer", "text": "Set the paused prop on glass views that are mounted but not visible, avoid stacking glass on glass, leave tilt off for persistent chrome such as tab bars, lower blurRadius, and reduce the on-screen area the glass covers." } }
  ]
}
</script>
