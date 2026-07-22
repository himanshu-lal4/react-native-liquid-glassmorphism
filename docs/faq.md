---
layout: page
title: "React Native Liquid Glass — FAQ"
description: "Answers to common questions about Liquid Glass in React Native: Expo support, iOS 26 requirement, how Android glass works, custom shapes, interactivity, fallbacks, and how it compares to blur libraries."
permalink: /faq/
---

# Frequently asked questions

## How do I add Liquid Glass to a React Native app?

Install `react-native-liquid-glassmorphism`, rebuild the native app (it's a native module, so not Expo Go — use a dev build / `expo prebuild`), and wrap content in `<LiquidGlassView>`. On iOS 26 it renders Apple's native `UIGlassEffect`; on Android it runs a real-time AGSL refraction shader. Children render crisply on top; only the backdrop is blurred and refracted.

## Does it work on Android, or is Liquid Glass iOS-only?

It works on both. Apple's Liquid Glass is iOS-only at the system level, but this library reproduces the optics on **Android** with a per-frame AGSL refractive-lens shader (Android 13 / API 33+): it captures the backdrop, blurs it, and bends it through a glass lozenge with edge refraction, chromatic dispersion, a mirrored edge reflection, and a Fresnel rim. Below API 33 it falls back to `RenderEffect` blur + tint, and below API 31 to a translucent tint.

## Does it need iOS 26?

For Apple's native `UIGlassEffect` (the real Liquid Glass), yes — iOS 26 SDK / Xcode 26. On iOS 15–25 it automatically falls back to a `UIBlurEffect` frosted look bucketed by `intensity`, so your UI still renders correctly on older devices.

## Does it work with Expo?

Yes — with a **development build** or `expo prebuild`. It's a native module, so it does **not** run in Expo Go. The module autolinks, and an optional config plugin is included; it's a pass-through today (no permission or SDK changes needed since the effect degrades by OS version at runtime).

## Does it support the New Architecture (Fabric)?

Yes. `LiquidGlassView` is a native Fabric component generated with codegen, and the same view manager delegate covers the old architecture too — so it works on both.

## How is this different from expo-blur or react-native-blur?

Those libraries only **blur** the backdrop. This one blurs **and refracts** it — real edge lensing, chromatic dispersion, a Fresnel rim, and interactive touch/tilt specular — plus native `UIGlassEffect` on iOS 26. It's the difference between a flat frosted pane and physically-modelled glass. See the [full comparison]({{ '/react-native-blur-alternative/' | relative_url }}).

## Can the glass be any shape?

Yes. The `shape` prop accepts `circle`, `squircle`, `polygon`, explicit `points`, or an arbitrary (even **concave**) SVG `path` — e.g. a tab-bar notch. The glass lenses the backdrop *through* the silhouette (a real optical shape, not just a clip): iOS masks it with a `CAShapeLayer`, Android rasterizes it into a signed-distance-field texture the shader samples.

## Is the glass interactive?

Optionally. Set `interactive` and the glass reacts to touch (a specular bloom + optical magnification under the finger) and to device tilt (a moving specular highlight). On iOS 26 this maps to Apple's native interactive glass.

## What are the requirements and bundle size?

React Native 0.83+ (Fabric or old architecture), no JS runtime dependencies beyond React Native itself. Full effect needs iOS 26 SDK or Android 13 (API 33+); older OS versions get automatic blur/tint fallbacks. It ships first-class TypeScript types.

## Does it support web?

Not yet — the library is mobile-only (iOS + Android) for now. Web support is on the roadmap.

<!-- JSON-LD FAQPage: eligible for Google rich results & AI Overviews extraction. -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "How do I add Liquid Glass to a React Native app?",
      "acceptedAnswer": { "@type": "Answer", "text": "Install react-native-liquid-glassmorphism, rebuild the native app (it's a native module, so use a dev build or expo prebuild, not Expo Go), and wrap content in a LiquidGlassView. On iOS 26 it renders Apple's native UIGlassEffect; on Android it runs a real-time AGSL refraction shader. Children render crisply on top; only the backdrop is blurred and refracted." } },
    { "@type": "Question", "name": "Does it work on Android, or is Liquid Glass iOS-only?",
      "acceptedAnswer": { "@type": "Answer", "text": "It works on both. Apple's Liquid Glass is iOS-only at the system level, but this library reproduces the optics on Android with a per-frame AGSL refractive-lens shader (API 33+): it captures the backdrop, blurs it, and bends it through a glass lozenge with edge refraction, chromatic dispersion, a mirrored edge reflection, and a Fresnel rim. Below API 33 it falls back to blur plus tint, and below API 31 to a translucent tint." } },
    { "@type": "Question", "name": "Does it need iOS 26?",
      "acceptedAnswer": { "@type": "Answer", "text": "For Apple's native UIGlassEffect (the real Liquid Glass), yes — iOS 26 SDK / Xcode 26. On iOS 15 to 25 it automatically falls back to a UIBlurEffect frosted look bucketed by intensity, so the UI still renders correctly on older devices." } },
    { "@type": "Question", "name": "Does it work with Expo?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes, with a development build or expo prebuild. It's a native module, so it does not run in Expo Go. The module autolinks and an optional config plugin is included." } },
    { "@type": "Question", "name": "Does it support the New Architecture (Fabric)?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes. LiquidGlassView is a native Fabric component generated with codegen, and the same view manager delegate covers the old architecture too, so it works on both." } },
    { "@type": "Question", "name": "How is this different from expo-blur or react-native-blur?",
      "acceptedAnswer": { "@type": "Answer", "text": "Those libraries only blur the backdrop. This one blurs and refracts it — real edge lensing, chromatic dispersion, a Fresnel rim, and interactive touch/tilt specular — plus native UIGlassEffect on iOS 26. It is the difference between a flat frosted pane and physically-modelled glass." } },
    { "@type": "Question", "name": "Can the glass be any shape?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes. The shape prop accepts circle, squircle, polygon, explicit points, or an arbitrary concave SVG path such as a tab-bar notch. The glass lenses the backdrop through the silhouette: iOS masks it with a CAShapeLayer, Android rasterizes it into a signed-distance-field texture the shader samples." } },
    { "@type": "Question", "name": "Is the glass interactive?",
      "acceptedAnswer": { "@type": "Answer", "text": "Optionally. Set interactive and the glass reacts to touch (a specular bloom plus optical magnification under the finger) and to device tilt (a moving specular highlight). On iOS 26 this maps to Apple's native interactive glass." } },
    { "@type": "Question", "name": "What are the requirements and bundle size?",
      "acceptedAnswer": { "@type": "Answer", "text": "React Native 0.83+ (Fabric or old architecture), with no JS runtime dependencies beyond React Native itself. The full effect needs the iOS 26 SDK or Android 13 (API 33+); older OS versions get automatic blur/tint fallbacks. It ships first-class TypeScript types." } },
    { "@type": "Question", "name": "Does it support web?",
      "acceptedAnswer": { "@type": "Answer", "text": "Not yet — the library is mobile-only (iOS and Android) for now. Web support is on the roadmap." } }
  ]
}
</script>
