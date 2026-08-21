---
layout: page
title: "Glass Merging on iOS & Android"
description: "Make React Native glass views merge into one liquid body as they approach: UIGlassContainerEffect on iOS 26 and a smooth-min AGSL shader on Android."
permalink: /react-native-glass-merging/
---

# Glass that merges

Apple's Liquid Glass has a behaviour that is easy to miss until you look for it: when two glass elements come close, they do not overlap as two separate panes. They **merge** — the gap between them fills with a liquid neck, and for a moment they are one body of glass.

`<LiquidGlassContainer>` gives you that, **on iOS and on Android**.

On iOS 26 it hands the work to Apple's own `UIGlassContainerEffect`. Android has no OS equivalent — nothing to wrap, no API to call — so the container renders a single glass surface and blends the children's shapes together inside the shader. As far as we know this is the only React Native library that merges glass on Android.

## The whole API is one prop

{% raw %}
```tsx
import { LiquidGlassContainer, LiquidGlassView } from 'react-native-liquid-glassmorphism';

<LiquidGlassContainer spacing={40} style={StyleSheet.absoluteFill}>
  <LiquidGlassView style={{ width: 96, height: 96, borderRadius: 48 }} />
  <LiquidGlassView style={{ width: 96, height: 96, borderRadius: 48 }} />
</LiquidGlassContainer>
```
{% endraw %}

`spacing` is the distance, in dp, at which children begin to merge. Bring two views closer than that and the neck forms between them.

**`spacing` defaults to `0`, and `0` means off.** That is deliberate: it is the single switch for the whole feature, and it is also exactly what every unsupported platform does. Below iOS 26, on the web, and anywhere the glass tier is too low, the children simply render as ordinary separate glass. Nothing to feature-detect and nothing to branch on.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `spacing` | `number` | `0` | Distance in dp at which glass children start merging. `0` disables merging. |

Everything else is a normal `ViewProps` — the container lays out like a `<View>`.

## What counts as a child

Any `<LiquidGlassView>` **anywhere in the subtree**, not just the direct children. You can wrap them in layout views, position them absolutely, put them in a row, and they still merge:

{% raw %}
```tsx
<LiquidGlassContainer spacing={44} style={styles.stage}>
  <View style={styles.row}>
    <LiquidGlassView style={styles.orb} />
    <LiquidGlassView style={styles.orb} />
  </View>
  <Animated.View style={{ transform: [{ translateX }] }}>
    <LiquidGlassView style={styles.orb} />
  </Animated.View>
</LiquidGlassContainer>
```
{% endraw %}

## It is built to be animated

The merge is **analytic**. Each child contributes a rounded rectangle, and the shader computes the merged silhouette per pixel with a smooth-minimum function — the same trick raymarchers use for metaballs.

The practical consequence is what it costs when something moves. A child changing position uploads a handful of floats to the shader. It does **not** rebuild a distance field. That is the difference between this and the `secondaryShape` prop, and it is the reason this one can be driven from an animation at 60fps while `secondaryShape` cannot.

Position is read with `getLocationInWindow`, so **transform-based animation works**. A view moved with `translateX` merges from where it actually appears on screen, not from where it was originally laid out.

## Per-platform behaviour

| | iOS 26+ | iOS < 26 | Android 13+ (API 33) | Android < 13 |
| --- | --- | --- | --- | --- |
| Merging | ✅ `UIGlassContainerEffect` | ❌ separate glass | ✅ AGSL smooth-min | ❌ separate glass |
| Who renders it | The OS | — | One shader surface | — |

In every unsupported case the children still render as ordinary glass and lay out identically. Merging is an enhancement that is absent, not a feature that breaks.

## Android limits worth knowing

Three, all of them consequences of doing in a shader what iOS gets from the OS.

**Bodies are rounded rectangles.** Each child merges as a rectangle built from its size and its `borderRadius`. A child with a custom `shape` — a star, a polygon, an arbitrary SVG path — still renders its own shape, but it merges as its bounding rounded rect. If you need a non-rectangular silhouette to participate in a merge, `secondaryShape` is the prop for that; it is exact, but it rebuilds a distance field and so is not animatable.

**At most eight children merge.** The shader's uniform array needs a compile-time bound. Past the eighth, the extra children keep drawing their own unmerged glass rather than disappearing, and the library logs a warning once:

```
LiquidGlassContainer has 11 glass children but can merge at most 8
(the AGSL uniform array needs a compile-time bound).
The rest render as ordinary unmerged glass.
```

A child can cross that boundary just because another one mounted, so the failure mode is deliberately "stops merging", never "vanishes".

**The container adopts the first merged child's material.** Because Android draws the merged group as one surface, that surface can only have one material. It takes `variant`, `tintColor` and the rest from the first child it merges. Give the children in one container the same material — mixing a `clear` and a `regular` child inside a single container is not a thing the merged surface can represent.

## Where it earns its keep

- **A floating action button that spawns its actions.** The children grow out of the parent as one body of mercury rather than popping in as separate discs.
- **Tab bars and docks with a moving selection pill.** The pill merges with the bar as it slides.
- **Grouped controls.** Two adjacent buttons read as one carved piece of glass instead of two panes with a seam.
- **Loaders and transitions.** Merging orbs are the single most recognisably "Liquid Glass" motion there is.

## See also

- [API reference]({{ '/api/' | relative_url }}) — every prop on `<LiquidGlassView>`
- [Android Liquid Glass / AGSL]({{ '/android-liquid-glass/' | relative_url }}) — how the refraction shader works and how it degrades
- [iOS 26 Liquid Glass]({{ '/ios-26-liquid-glass/' | relative_url }}) — native `UIGlassEffect` and the pre-26 fallback
- [Recipes]({{ '/recipes/' | relative_url }}) — copy-paste components
