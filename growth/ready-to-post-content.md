# Ready-to-post promo copy

Two React Native libraries by Himanshu Lal (https://github.com/himanshu-lal4). Everything below is written to paste as-is after a quick review. All feature claims and code snippets were verified against the repos' `src/`, READMEs, and docs on 2026-07-22. No fabricated metrics (no download/star counts). No AI attribution anywhere.

**Reusable facts**

- **react-native-liquid-glassmorphism** — v1.0.0. npm `react-native-liquid-glassmorphism` · docs https://himanshu-lal4.github.io/react-native-liquid-glassmorphism/ · repo https://github.com/himanshu-lal4/react-native-liquid-glassmorphism · Android AGSL deep-dive blog: `growth/blog-android-agsl-deep-dive.md` (publish to dev.to). NOTE: native module — does NOT run in Expo Go (needs a dev build / `expo prebuild`).
- **@wrack/react-native-tour-guide** — v1.0.1. npm `@wrack/react-native-tour-guide` · docs https://himanshu-lal4.github.io/react-native-tour-guide/ · repo https://github.com/himanshu-lal4/react-native-tour-guide · zero native deps (peer: `react-native-svg`), runs in Expo Go.

---
---

# PART 1 — react-native-liquid-glassmorphism

---

## LinkedIn — Liquid Glass

Apple shipped Liquid Glass as a system material in iOS 26. Android shipped nothing like it. So I built a React Native library that gives you both from one component.

react-native-liquid-glassmorphism (v1.0.0) renders Apple's native `UIGlassEffect` on iOS 26, and on Android — where there's no system glass — it reproduces the optics in a real-time AGSL shader: it captures the backdrop, blurs it, then refracts it through a modelled glass lozenge with edge lensing, chromatic dispersion, a Fresnel rim, and touch/tilt specular highlights. Same declarative API on both platforms.

What's in it:
- One `<LiquidGlassView>` component, identical props on iOS + Android
- Custom shapes — circle, squircle, polygon, star, or arbitrary concave SVG paths
- Interactive touch response + optional device-tilt specular
- New Architecture (Fabric) + full TypeScript types
- Graceful fallbacks down the OS ladder (it's honest about what renders per tier)

Heads up: it's a native module, so it needs a dev build — not Expo Go.

Docs: https://himanshu-lal4.github.io/react-native-liquid-glassmorphism/
npm: https://www.npmjs.com/package/react-native-liquid-glassmorphism

I also built @wrack/react-native-tour-guide — spotlight app tours/coach marks that run in Expo Go with zero native deps: https://himanshu-lal4.github.io/react-native-tour-guide/

#reactnative #androiddev #iosdev #mobiledev #ui #opensource

---

## X / Twitter thread — Liquid Glass

**Tweet 1 (hook)** — [attach the side-by-side iOS + Android demo GIF]
Apple's Liquid Glass is iOS 26 only. So I rebuilt the optics on Android too.

react-native-liquid-glassmorphism: native `UIGlassEffect` on iOS, a real-time AGSL refraction shader on Android. One component, same API. 🧵

**Tweet 2**
On Android there's no system glass. So each frame the library captures the backdrop, blurs it on the GPU, then runs an AGSL shader that actually *refracts* it — edge lensing, chromatic dispersion, a mirrored rim echo, and a Fresnel highlight. Not a blur. A lens.

**Tweet 3**
The API is boringly simple:

```tsx
<LiquidGlassView variant="regular" interactive borderRadius={24}>
  <Text>Frosted glass</Text>
</LiquidGlassView>
```

Plus custom shapes — circle, squircle, polygon, star, or any concave SVG path — and touch/tilt specular.

**Tweet 4**
It degrades honestly by OS tier: full AGSL lens on Android 13+ (API 33+), blur+tint below, translucent tint on old devices. iOS falls back to `UIBlurEffect` below iOS 26. It's a native module, so use a dev build — not Expo Go.

**Tweet 5 (links)**
v1.0.0 is out:
Docs → https://himanshu-lal4.github.io/react-native-liquid-glassmorphism/
npm → https://www.npmjs.com/package/react-native-liquid-glassmorphism
Repo → https://github.com/himanshu-lal4/react-native-liquid-glassmorphism

I also made @wrack/react-native-tour-guide (spotlight tours, Expo Go): https://github.com/himanshu-lal4/react-native-tour-guide

---

## Bluesky — Liquid Glass

Apple's Liquid Glass is iOS 26 only — so I rebuilt the optics on Android too.

react-native-liquid-glassmorphism v1.0.0: native `UIGlassEffect` on iOS, a real-time AGSL refraction shader (edge lensing + chromatic dispersion + specular) on Android. One `<LiquidGlassView>`, same API on both. Native module, so use a dev build (not Expo Go).

Docs: https://himanshu-lal4.github.io/react-native-liquid-glassmorphism/
npm: react-native-liquid-glassmorphism

(also by me: @wrack/react-native-tour-guide — Expo-Go spotlight tours: https://himanshu-lal4.github.io/react-native-tour-guide/)

---

## Reddit r/reactnative — Liquid Glass

**Title:** I built a Liquid Glass library that works on Android too — native UIGlassEffect on iOS 26, a real-time AGSL refraction shader on Android

**Body:**

Most React Native "glass" is just a blur, and the Liquid Glass options I found were iOS-only. I wanted the real iOS 26 look on both platforms from one component, so I built `react-native-liquid-glassmorphism` (v1.0.0).

How it works:
- **iOS:** composites Apple's native `UIGlassEffect` on iOS 26; falls back to `UIVisualEffectView` + `UIBlurEffect` below 26.
- **Android:** there's no system Liquid Glass, so each frame it captures the backdrop into a downscaled bitmap, GPU-blurs it, then runs an AGSL shader that models a glass lozenge — Snell-style edge refraction, chromatic dispersion, a mirrored edge reflection, adaptive frost + vibrant tint, and a Fresnel rim with touch/tilt specular. Degrades to blur+tint on API 31–32 and a translucent tint below that.

The API is one component with the same props on both platforms:

```tsx
import { LiquidGlassView } from 'react-native-liquid-glassmorphism';

<LiquidGlassView
  variant="regular"            // 'regular' | 'clear'
  tintColor="rgba(10,132,255,0.5)"
  interactive                  // touch bloom + magnification
  borderRadius={24}
  style={{ padding: 16 }}
>
  <Text>Frosted glass content</Text>
</LiquidGlassView>
```

It also does custom shapes (circle/squircle/polygon/star/points, or arbitrary concave SVG paths — the glass lenses the backdrop *through* the silhouette), New Architecture (Fabric), and full TypeScript types.

Honest limitations: it's a native module, so it does **not** run in Expo Go — you need a dev build / `expo prebuild`. The full refraction needs iOS 26 SDK (Xcode 26) on iOS and API 33+ on Android; below those you get blur/tint fallbacks. No web yet.

Disclosure: I'm the author. Feedback, bug reports, and PRs are all welcome.

Docs: https://himanshu-lal4.github.io/react-native-liquid-glassmorphism/
npm: https://www.npmjs.com/package/react-native-liquid-glassmorphism
Repo: https://github.com/himanshu-lal4/react-native-liquid-glassmorphism

(Unrelated second lib I maintain, in case it's useful: `@wrack/react-native-tour-guide` for spotlight onboarding tours — that one *does* run in Expo Go.)

---

## Reddit r/androiddev — Liquid Glass (AGSL-shader lead)

**Title:** I reproduced iOS 26's Liquid Glass optics on Android with a real-time AGSL refraction shader (RenderNode backdrop capture + RuntimeShader)

**Body:**

Apple ships Liquid Glass as a system material on iOS 26 — real edge refraction, chromatic dispersion at the rim, a specular that tracks the device. Android ships nothing like it, so I rebuilt the optics from scratch for a React Native library (`react-native-liquid-glassmorphism`), and the Android side is the interesting part for this sub.

The per-frame pipeline (API 33+):
1. Capture the view hierarchy behind the glass into a downscaled bitmap.
2. GPU Gaussian blur (RenderEffect).
3. A hand-written **AGSL `RuntimeShader`** that models a glass lozenge: an SDF-derived surface normal → Snell-style edge refraction → chromatic dispersion → a mirrored edge reflection → adaptive frost + vibrant tint → Fresnel rim + tilt/touch specular.

Custom shapes are rasterised into a signed-distance-field texture the shader samples, so the refraction/rim/dispersion follow any silhouette — including concave ones (e.g. a tab-bar notch).

It degrades by tier: full AGSL lens on API 33+, RenderEffect blur + Canvas tint/specular on API 31–32, translucent tint + rim below 31. You can confirm which path ran via logcat (`LiquidGlass: render tier=agsl|blur|tint shaderCompiled=…`). Build notes: needs compileSdk 34+ and a current NDK (tested with NDK 27.1.12297006).

I wrote up the whole engineering story — backdrop capture, RenderEffect, and the shader math — as a deep dive (going up on dev.to): the draft is `growth/blog-android-agsl-deep-dive.md` in the repo.

Disclosure: I'm the author. Happy to go deeper on the shader in the comments.

Repo: https://github.com/himanshu-lal4/react-native-liquid-glassmorphism
Docs: https://himanshu-lal4.github.io/react-native-liquid-glassmorphism/

---

## Reddit r/iOSProgramming — Liquid Glass (iOS 26 UIGlassEffect angle)

**Title:** A React Native wrapper over iOS 26's UIGlassEffect (with an Android fallback that refracts the backdrop itself)

**Body:**

I built a React Native library that composites Apple's native `UIGlassEffect` on iOS 26 — so on-device you get the real system Liquid Glass material, interactive variant included, not a hand-rolled blur. Below iOS 26 it falls back to `UIVisualEffectView` + `UIBlurEffect` bucketed by an `intensity` prop, and a custom `shape` masks the glass with a `CAShapeLayer`.

The reason it exists cross-platform: Liquid Glass is iOS-only at the system level, so for the Android half I had to reproduce the optics with a real-time AGSL refraction shader. But if you're iOS-first, the point is that it's the genuine `UIGlassEffect` on 26, with a sensible fallback path older devices.

It's a native Fabric component (New Architecture) with an old-arch delegate too, and full TypeScript types. It's a native module, so it needs a real build (dev build / prebuild) — not Expo Go. Native `UIGlassEffect` specifically requires the iOS 26 SDK / Xcode 26.

Disclosure: I'm the author. Feedback welcome.

Repo: https://github.com/himanshu-lal4/react-native-liquid-glassmorphism
Docs: https://himanshu-lal4.github.io/react-native-liquid-glassmorphism/
npm: https://www.npmjs.com/package/react-native-liquid-glassmorphism

---

## Hacker News — Show HN (Liquid Glass, primary)

**Title:** Show HN: Liquid Glass for React Native, with a real AGSL refraction shader on Android

**First self-comment:**

I'm the author. This is a React Native library that renders iOS 26's Liquid Glass look on both platforms from a single `<LiquidGlassView>` component.

On iOS 26 it composites Apple's native `UIGlassEffect` (falling back to `UIBlurEffect` below 26). Android has no system Liquid Glass, so I rebuilt the optics: each frame it captures the backdrop, GPU-blurs it, then runs a hand-written AGSL shader that refracts the result through a modelled glass lozenge — SDF-derived surface normal, Snell-style edge refraction, chromatic dispersion, a mirrored rim echo, a Fresnel highlight, and touch/tilt specular. It's a lens, not just a blur.

Why I built it: most RN "glass" is a blur view, and the Liquid Glass options I could find were iOS-only. I wanted the actual refractive optics, on Android too, behind one declarative API. Custom shapes were the interesting sub-problem — the silhouette (including concave SVG paths) is rasterised to a signed-distance field the shader samples, so the lensing follows the shape.

Honest limitations:
- It's a native module — it does NOT run in Expo Go. Use a dev build / `expo prebuild`.
- Full effect needs iOS 26 SDK on iOS and Android 13 / API 33+ on Android. Below those it degrades: blur+tint on API 31–32, translucent tint below 31; `UIBlurEffect` below iOS 26. The README has the exact per-tier matrix.
- No web yet — mobile only.

I wrote up the Android engineering (backdrop capture → RenderEffect → the shader) as a long-form deep dive if you want the details.

Repo: https://github.com/himanshu-lal4/react-native-liquid-glassmorphism
Docs: https://himanshu-lal4.github.io/react-native-liquid-glassmorphism/

Happy to answer questions about the shader or the backdrop-capture path.

---

## Product Hunt — Liquid Glass

**Name:** react-native-liquid-glassmorphism

**Tagline (≤60 chars):** Liquid Glass for React Native — iOS 26 and Android

**Description:**
Bring Apple's iOS 26 Liquid Glass to React Native on both platforms from a single declarative component. On iOS 26 it renders the native `UIGlassEffect`; on Android — which has no system glass — it reproduces the optics with a real-time AGSL refraction shader: edge lensing, chromatic dispersion, a Fresnel rim, and interactive touch/tilt specular. Custom shapes (including concave SVG silhouettes), New Architecture support, and full TypeScript types. Native module, so it runs in a dev build rather than Expo Go.

**Maker's first comment:**
Hey Product Hunt — maker here. I built this because most "glass" in React Native is just a blur, and every Liquid Glass option I found was iOS-only. I wanted the real refractive optics on Android too, behind the same one-line API as iOS.

The Android path was the fun part: there's no system Liquid Glass, so I capture the backdrop each frame, blur it on the GPU, and run a hand-written AGSL shader that actually refracts it — not a fake. It degrades gracefully on older OS versions, and it's honest in the docs about exactly what renders per tier.

It's a native module (dev build, not Expo Go). Would love feedback, bug reports, and shape ideas. I also make @wrack/react-native-tour-guide for spotlight onboarding tours if that's useful to anyone.

Docs: https://himanshu-lal4.github.io/react-native-liquid-glassmorphism/
npm: https://www.npmjs.com/package/react-native-liquid-glassmorphism

---

## Peerlist — Liquid Glass launch post

**Title:** react-native-liquid-glassmorphism — Liquid Glass for React Native (iOS 26 + Android)

**Body:**
Just shipped v1.0.0 of react-native-liquid-glassmorphism — an open-source library that brings Apple's iOS 26 Liquid Glass to React Native on *both* iOS and Android from one component.

- iOS 26: native `UIGlassEffect` (with a `UIBlurEffect` fallback below 26)
- Android: a real-time AGSL refraction shader — backdrop capture → GPU blur → edge lensing + chromatic dispersion + Fresnel rim + touch/tilt specular
- Custom shapes (circle, squircle, polygon, star, arbitrary concave SVG paths)
- New Architecture (Fabric) + full TypeScript types
- Honest per-OS fallbacks; native module (dev build, not Expo Go)

I also wrote a deep-dive on how the Android shader works, from backdrop capture to the refraction math.

Docs: https://himanshu-lal4.github.io/react-native-liquid-glassmorphism/
npm: https://www.npmjs.com/package/react-native-liquid-glassmorphism
Repo: https://github.com/himanshu-lal4/react-native-liquid-glassmorphism

Also by me: @wrack/react-native-tour-guide (spotlight onboarding tours, runs in Expo Go) → https://himanshu-lal4.github.io/react-native-tour-guide/

---

## Reactiflux / Expo Discord — Liquid Glass (short, non-spammy)

Sharing something I just open-sourced in case it's useful: `react-native-liquid-glassmorphism` (v1.0.0) does iOS 26 Liquid Glass on both platforms — native `UIGlassEffect` on iOS, and a real-time AGSL refraction shader on Android (not just a blur). One `<LiquidGlassView>` component, custom shapes, TS types. Note it's a native module so it needs a dev build, not Expo Go. Docs: https://himanshu-lal4.github.io/react-native-liquid-glassmorphism/ — happy to hear feedback.

---

## YouTube / Shorts / Reels — Liquid Glass (the visual one)

**Title:** iOS 26 Liquid Glass in React Native — on Android too (real-time shader)

**Description:**
A quick look at react-native-liquid-glassmorphism: Apple's native iOS 26 `UIGlassEffect` on iOS, and a real-time AGSL refraction shader on Android that captures the backdrop and bends it through a glass lens — edge refraction, chromatic dispersion, and touch/tilt specular. Same `<LiquidGlassView>` component on both platforms, plus custom shapes.

It's a native module, so it runs in a dev build (not Expo Go).

Docs: https://himanshu-lal4.github.io/react-native-liquid-glassmorphism/
npm: https://www.npmjs.com/package/react-native-liquid-glassmorphism
Repo: https://github.com/himanshu-lal4/react-native-liquid-glassmorphism

**On-screen caption ideas:**
- Open on split screen (iOS left / Android right) over a colorful photo: "Same component. Both platforms."
- As a finger drags the glass: "Android — real-time AGSL refraction, not a blur"
- Zoom on the rim: "edge lensing · chromatic dispersion · Fresnel rim"
- Show a concave tab-bar notch shape: "any SVG shape — the glass lenses through it"
- End card: "react-native-liquid-glassmorphism · npm · v1.0.0"

---
---

# PART 2 — @wrack/react-native-tour-guide

---

## LinkedIn — Tour Guide

Onboarding tours in React Native usually mean fighting with spotlight shapes and off-screen targets. So I built a library that handles both automatically.

@wrack/react-native-tour-guide (v1.0.1) is a lightweight library for app tours, walkthroughs, and coach marks. Its spotlight automatically matches each target's border radius — circles stay circular, pills stay pill-shaped, per-corner radii are preserved — with no manual shape config. It also auto-scrolls so the target *and* its tooltip both stay on screen, and auto-positions the tooltip so it never renders off-screen.

What's in it:
- Auto shape-matching spotlight + smart auto-scroll + smart tooltip positioning
- 4 built-in themes + a `createTheme()` API, pulse animation, pause/resume
- "Show only once" persistence hook (AsyncStorage, MMKV, or any adapter)
- Conditional steps, custom tooltips, accessibility on by default
- Under 50KB, zero native dependencies (only `react-native-svg`) — so it runs in Expo Go, no custom dev build

Docs: https://himanshu-lal4.github.io/react-native-tour-guide/
npm: https://www.npmjs.com/package/@wrack/react-native-tour-guide

I also built react-native-liquid-glassmorphism — authentic iOS 26 Liquid Glass on iOS *and* Android: https://himanshu-lal4.github.io/react-native-liquid-glassmorphism/

#reactnative #expo #mobiledev #ux #onboarding #opensource

---

## X / Twitter thread — Tour Guide

**Tweet 1 (hook)** — [attach a screen recording of a spotlight tour stepping through a screen]
Building an onboarding tour in React Native and tired of hand-configuring spotlight shapes for every button?

@wrack/react-native-tour-guide matches the spotlight to each target's border radius automatically. Circles stay circular. 🧵

**Tweet 2**
Pass the component's style as `targetStyle` and the spotlight reads the border radius from it — uniform, partial, or per-corner (asymmetric chat bubbles included). No manual shape picker.

**Tweet 3**
It also auto-scrolls off-screen targets into view (so the target AND its tooltip both fit), auto-positions tooltips so they never render off-screen, and has a "show only once" persistence hook that works with AsyncStorage, MMKV, or any adapter.

```tsx
const { startTour } = useTourGuide();
startTour([
  { id: 'welcome', targetRef: btnRef, title: 'Welcome',
    description: 'Tap to start.', targetStyle: styles.button },
]);
```

**Tweet 4**
Under 50KB, zero native dependencies (only `react-native-svg` as a peer) — so it runs in Expo Go with no custom dev build. Full TypeScript types, 4 themes + `createTheme()`, pulse animation, pause/resume, conditional steps.

**Tweet 5 (links)**
v1.0.1 is out:
Docs → https://himanshu-lal4.github.io/react-native-tour-guide/
npm → https://www.npmjs.com/package/@wrack/react-native-tour-guide
Repo → https://github.com/himanshu-lal4/react-native-tour-guide

I also made react-native-liquid-glassmorphism (iOS 26 Liquid Glass on iOS + Android): https://github.com/himanshu-lal4/react-native-liquid-glassmorphism

---

## Bluesky — Tour Guide

Built a React Native onboarding-tour library where the spotlight auto-matches each target's border radius (circles, pills, per-corner) — no manual shape config.

@wrack/react-native-tour-guide v1.0.1 also auto-scrolls to off-screen targets and auto-positions tooltips. <50KB, zero native deps, runs in Expo Go.

Docs: https://himanshu-lal4.github.io/react-native-tour-guide/
npm: @wrack/react-native-tour-guide

(also by me: react-native-liquid-glassmorphism — iOS 26 Liquid Glass on iOS + Android: https://himanshu-lal4.github.io/react-native-liquid-glassmorphism/)

---

## Reddit r/reactnative — Tour Guide

**Title:** I built a tour/coach-mark library where the spotlight auto-matches each target's shape and auto-scrolls to off-screen steps

**Body:**

Every onboarding-tour library I tried made me manually pick a spotlight shape per step, and none of them handled targets that were scrolled off screen. So I built `@wrack/react-native-tour-guide` (v1.0.1).

The two things it does that pushed me to write it:
- **Auto shape matching:** pass the component's style as `targetStyle` and the spotlight reads the border radius off it — uniform, partial (e.g. a 12px card), or per-corner (asymmetric chat bubbles). Fully-rounded elements stay perfect circles even when the spotlight is slightly larger. No manual shape picker.
- **Auto-scroll:** give it a `scrollRef` and it scrolls off-screen targets into view so the target *and* its tooltip both fit on screen.

Setup is a provider + overlay, then `startTour`:

```tsx
import { TourGuideProvider, TourGuideOverlay, useTourGuide } from '@wrack/react-native-tour-guide';

// wrap the app
<TourGuideProvider>
  <YourApp />
  <TourGuideOverlay />
</TourGuideProvider>

// start a tour
const { startTour } = useTourGuide();
startTour([
  { id: 'welcome', targetRef: buttonRef, title: 'Welcome',
    description: 'Tap here to get started.', targetStyle: styles.button },
]);
```

Other bits: smart tooltip positioning (never off-screen), 4 built-in themes + `createTheme()`, pulse animation, pause/resume, conditional steps (`active` flag with auto-renumbering), a `useTourPersistence` hook to show a tour only once (AsyncStorage/MMKV/custom adapter), custom tooltip renderer, and accessibility announcements on by default.

It's under 50KB with zero native dependencies — the only peer is `react-native-svg` — so it runs in Expo Go without a custom dev build. Ships with full TypeScript types and works on the New Architecture.

Disclosure: I'm the author. Bug reports and PRs welcome — happy to answer anything.

Docs: https://himanshu-lal4.github.io/react-native-tour-guide/
npm: https://www.npmjs.com/package/@wrack/react-native-tour-guide
Repo: https://github.com/himanshu-lal4/react-native-tour-guide

(Second lib I maintain, unrelated: `react-native-liquid-glassmorphism` for iOS 26 Liquid Glass on iOS + Android.)

---

## Reddit r/expo — Tour Guide (Expo Go angle)

**Title:** A React Native onboarding-tour library that actually runs in Expo Go — zero native deps, spotlight auto-matches each target's shape

**Body:**

A lot of tour/coach-mark libraries pull in native modules, which means leaving Expo Go for a dev build just to prototype onboarding. I wanted one that runs in Expo Go as-is, so I built `@wrack/react-native-tour-guide` (v1.0.1).

It has **zero native dependencies** — the only peer is `react-native-svg`, which Expo supports out of the box — and it's under 50KB. Works with Expo (managed and bare) and React Native CLI.

What it does:
- Spotlight automatically matches each target's border radius (circles, pills, per-corner radii) — you just pass the component's style as `targetStyle`, no manual shape config
- Auto-scrolls off-screen targets into view so the target and its tooltip both fit (works with ScrollView/FlatList/SectionList via a `scrollRef`)
- Smart tooltip positioning, 4 themes + `createTheme()`, pulse animation, pause/resume, conditional steps, and a "show only once" persistence hook (AsyncStorage/MMKV/custom)
- Full TypeScript types; accessibility (VoiceOver/TalkBack) on by default

The overlay is drawn with a single even-odd SVG path (a real punched-out hole) rather than an SVG `<Mask>`, so the spotlight renders correctly on both old arch and Fabric — no white film over the highlighted element.

Disclosure: I'm the author. Feedback welcome.

Docs: https://himanshu-lal4.github.io/react-native-tour-guide/
npm: https://www.npmjs.com/package/@wrack/react-native-tour-guide
Repo: https://github.com/himanshu-lal4/react-native-tour-guide

---

## Hacker News — Show HN (Tour Guide variant)

**Title:** Show HN: A React Native tour library whose spotlight auto-matches each target's shape

**First self-comment:**

I'm the author. `@wrack/react-native-tour-guide` is a library for onboarding tours, walkthroughs, and coach marks in React Native.

The reason it exists: every tour library I tried made me manually choose a spotlight shape per step, and none handled targets scrolled off screen. This one reads the border radius off the target's own style (`targetStyle`) and matches the spotlight automatically — uniform, partial, or per-corner (asymmetric bubbles included) — and auto-scrolls so the target and its tooltip both stay on screen. Tooltips auto-position so they never render off-screen.

It's under 50KB with zero native dependencies (only `react-native-svg` as a peer), so it runs in Expo Go without a custom dev build. There's a "show only once" persistence hook that takes any storage adapter (AsyncStorage, MMKV, custom), plus themes, pulse animation, pause/resume, conditional steps, custom tooltips, and accessibility announcements on by default. Full TypeScript types.

One implementation detail I'm happy with: the dark overlay is a single even-odd SVG path (a genuine punched-out hole) instead of an SVG mask, which avoids the faint white film over the highlighted element you sometimes get on the New Architecture.

Limitations: it needs the target mounted and on screen when measured; for off-screen targets you pass a `scrollRef`. No web.

Repo: https://github.com/himanshu-lal4/react-native-tour-guide
Docs: https://himanshu-lal4.github.io/react-native-tour-guide/

Happy to answer questions.

---

## Product Hunt — Tour Guide

**Name:** @wrack/react-native-tour-guide

**Tagline (≤60 chars):** Auto-shaping spotlight tours for React Native

**Description:**
A lightweight React Native library for onboarding tours, walkthroughs, and coach marks. The spotlight automatically matches each target's border radius — circles, pills, per-corner radii — with no manual shape config. It auto-scrolls off-screen targets into view, auto-positions tooltips so they never render off-screen, and includes themes, pulse animation, pause/resume, conditional steps, and a "show only once" persistence hook. Under 50KB, zero native dependencies (only `react-native-svg`), so it runs in Expo Go. Full TypeScript types.

**Maker's first comment:**
Maker here. I kept hitting the same two problems building onboarding in React Native: every tour library made me manually pick a spotlight shape per step, and none scrolled to targets that were off screen. So this one reads the shape from the target's own style and matches automatically, and auto-scrolls so the target and its tooltip always fit.

I also cared about it running in Expo Go — no custom dev build — so it has zero native deps beyond `react-native-svg`. Themes, persistence ("show once"), pause/resume, and conditional steps are built in.

Would love feedback and step-layout ideas. I also make react-native-liquid-glassmorphism (iOS 26 Liquid Glass on iOS + Android) if that's useful.

Docs: https://himanshu-lal4.github.io/react-native-tour-guide/
npm: https://www.npmjs.com/package/@wrack/react-native-tour-guide

---

## Peerlist — Tour Guide launch post

**Title:** @wrack/react-native-tour-guide — auto-shaping spotlight tours for React Native

**Body:**
Shipped @wrack/react-native-tour-guide (v1.0.1) — a lightweight library for onboarding tours, walkthroughs, and coach marks in React Native.

- Spotlight auto-matches each target's border radius (circles, pills, per-corner) — no manual shape config
- Auto-scrolls off-screen targets into view; auto-positions tooltips so they never clip
- 4 themes + `createTheme()`, pulse animation, pause/resume, conditional steps
- "Show only once" persistence hook (AsyncStorage, MMKV, or any adapter)
- Under 50KB, zero native dependencies (only `react-native-svg`) — runs in Expo Go
- Full TypeScript types; accessibility on by default

Docs: https://himanshu-lal4.github.io/react-native-tour-guide/
npm: https://www.npmjs.com/package/@wrack/react-native-tour-guide
Repo: https://github.com/himanshu-lal4/react-native-tour-guide

Also by me: react-native-liquid-glassmorphism (iOS 26 Liquid Glass on iOS + Android) → https://himanshu-lal4.github.io/react-native-liquid-glassmorphism/

---

## Reactiflux / Expo Discord — Tour Guide (short, non-spammy)

In case anyone's building onboarding: I open-sourced `@wrack/react-native-tour-guide` (v1.0.1) — spotlight tours/coach marks where the spotlight auto-matches each target's border radius and auto-scrolls to off-screen steps. Zero native deps (only `react-native-svg`), <50KB, so it runs in Expo Go. Docs: https://himanshu-lal4.github.io/react-native-tour-guide/ — feedback welcome.

---

## YouTube / Shorts / Reels — Tour Guide (screen-recording idea)

**Title:** Onboarding tours in React Native where the spotlight matches every shape automatically

**Description:**
A quick demo of @wrack/react-native-tour-guide: define your steps, call `startTour()`, and the library measures each element, matches the spotlight to its border radius (circles, pills, per-corner), auto-scrolls off-screen targets into view, and positions the tooltip so it never clips. Zero native dependencies, runs in Expo Go.

Docs: https://himanshu-lal4.github.io/react-native-tour-guide/
npm: https://www.npmjs.com/package/@wrack/react-native-tour-guide
Repo: https://github.com/himanshu-lal4/react-native-tour-guide

**On-screen caption ideas (screen recording of a live app):**
- Tour steps onto a round avatar: "circle target → circle spotlight, automatically"
- Steps onto a rounded card: "12px card → 12px spotlight — no config"
- Tour scrolls down to a button below the fold: "auto-scrolls to off-screen steps"
- Tooltip flips above the target near the bottom edge: "tooltips never render off-screen"
- End card: "@wrack/react-native-tour-guide · runs in Expo Go"

---
---

# BOILERPLATE BLOCKS (paste into any footer)

**react-native-liquid-glassmorphism**
> react-native-liquid-glassmorphism — authentic iOS 26 Liquid Glass for React Native on both iOS and Android: native `UIGlassEffect` on iOS 26, a real-time AGSL refraction shader on Android. npm: `react-native-liquid-glassmorphism` · Docs: https://himanshu-lal4.github.io/react-native-liquid-glassmorphism/ · Repo: https://github.com/himanshu-lal4/react-native-liquid-glassmorphism

**@wrack/react-native-tour-guide**
> @wrack/react-native-tour-guide — lightweight spotlight app tours, walkthroughs, and coach marks for React Native. Auto shape-matching spotlight, smart auto-scroll, zero native deps, runs in Expo Go. npm: `@wrack/react-native-tour-guide` · Docs: https://himanshu-lal4.github.io/react-native-tour-guide/ · Repo: https://github.com/himanshu-lal4/react-native-tour-guide

---

## Verification notes

- All code snippets were checked against `src/` in both repos:
  - Liquid Glass: `LiquidGlassView`, props `variant`, `tintColor`, `intensity`, `interactive`, `tilt`, `borderRadius`, `shape`, `refraction`, `thickness`, `edgeReflectionStrength`, `legibilityFloor` — verified in `src/types.ts` and `src/index.tsx`.
  - Tour Guide: `TourGuideProvider`, `TourGuideOverlay`, `useTourGuide`, `startTour`, `targetStyle`, `scrollRef`, `useTourPersistence`, themes/`createTheme` — verified in `src/index.tsx` and README API tables.
- Versions verified in `package.json`: liquid-glass **1.0.0**, tour-guide **1.0.1**.
- No download counts, star counts, or other metrics cited anywhere.
- Android deep-dive blog referenced (not rewritten): `growth/blog-android-agsl-deep-dive.md`.
</content>
</invoke>
