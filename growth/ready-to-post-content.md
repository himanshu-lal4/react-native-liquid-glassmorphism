# Ready-to-post promo copy

Two React Native libraries by Himanshu Lal (https://github.com/himanshu-lal4). Everything below is written to paste as-is after a quick review. All feature claims and code snippets were verified against the repos' `src/`, READMEs, and docs on 2026-07-22. No fabricated metrics (no download/star counts). No AI attribution anywhere.

**Channels kept:** LinkedIn · Hacker News (Show HN) · Reactiflux/Expo Discord · blogs (dev.to/Hashnode/Medium/daily.dev) · directories · newsletters. *(Reddit, Product Hunt, Peerlist, X/Twitter, Bluesky, YouTube/Shorts, TikTok, Reels intentionally excluded.)*

**Reusable facts**

- **react-native-liquid-glassmorphism** — v1.0.0. npm `react-native-liquid-glassmorphism` · docs https://himanshu-lal4.github.io/react-native-liquid-glassmorphism/ · repo https://github.com/himanshu-lal4/react-native-liquid-glassmorphism · Android AGSL deep-dive blog: `growth/blog-android-agsl-deep-dive.md` (publish to dev.to). NOTE: native module — does NOT run in Expo Go (needs a dev build / `expo prebuild`).
- **@wrack/react-native-tour-guide** — v1.0.1. npm `@wrack/react-native-tour-guide` · docs https://himanshu-lal4.github.io/react-native-tour-guide/ · repo https://github.com/himanshu-lal4/react-native-tour-guide · zero native deps (peer: `react-native-svg`), runs in Expo Go.

---
---

# PART 1 — react-native-liquid-glassmorphism

---

## LinkedIn — Liquid Glass

React Native Liquid Glass, on Android too: iOS 26 shipped Apple's Liquid Glass as a system material — Android shipped nothing like it, so I built one component that does both.

react-native-liquid-glassmorphism (v1.0.0) is a React Native library that renders Apple's native `UIGlassEffect` on iOS 26, and on Android — where there's no system glass — reproduces the optics in a real-time AGSL shader: it captures the backdrop, blurs it, then refracts it through a modelled glass lozenge with edge lensing, chromatic dispersion, a Fresnel rim, and touch/tilt specular highlights. Same declarative API on both platforms.

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

#reactnative #androiddev #iosdev #ui #opensource

---

## Hacker News — Show HN (Liquid Glass, primary)

**Title:** Show HN: React Native Liquid Glass, with a real AGSL refraction shader on Android

**First self-comment:**

I'm the author. react-native-liquid-glassmorphism is a React Native library that renders iOS 26's Liquid Glass on both platforms from a single `<LiquidGlassView>` component.

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

## Reactiflux / Expo Discord — Liquid Glass (short, non-spammy)

React Native Liquid Glass on iOS *and* Android — just open-sourced in case it's useful: `react-native-liquid-glassmorphism` (v1.0.0) does iOS 26 Liquid Glass on both platforms — native `UIGlassEffect` on iOS, and a real-time AGSL refraction shader on Android (not just a blur). One `<LiquidGlassView>` component, custom shapes, TS types. Note it's a native module so it needs a dev build, not Expo Go. Docs: https://himanshu-lal4.github.io/react-native-liquid-glassmorphism/ — happy to hear feedback.

---
---

# PART 2 — @wrack/react-native-tour-guide

---

## LinkedIn — Tour Guide

React Native onboarding tours usually mean fighting with spotlight shapes and off-screen targets — so I built a coach-marks library that handles both automatically, and it runs in Expo Go.

@wrack/react-native-tour-guide (v1.0.1) is a lightweight React Native library for app tours, walkthroughs, and coach marks. Its spotlight automatically matches each target's border radius — circles stay circular, pills stay pill-shaped, per-corner radii are preserved — with no manual shape config. It also auto-scrolls so the target *and* its tooltip both stay on screen, and auto-positions the tooltip so it never renders off-screen.

What's in it:
- Auto shape-matching spotlight + smart auto-scroll + smart tooltip positioning
- 4 built-in themes + a `createTheme()` API, pulse animation, pause/resume
- "Show only once" persistence hook (AsyncStorage, MMKV, or any adapter)
- Conditional steps, custom tooltips, accessibility on by default
- Under 50KB, zero native dependencies (only `react-native-svg`) — so it runs in Expo Go, no custom dev build

Docs: https://himanshu-lal4.github.io/react-native-tour-guide/
npm: https://www.npmjs.com/package/@wrack/react-native-tour-guide

I also built react-native-liquid-glassmorphism — authentic iOS 26 Liquid Glass on iOS *and* Android: https://himanshu-lal4.github.io/react-native-liquid-glassmorphism/

#reactnative #expo #onboarding #ux #opensource

---

## Hacker News — Show HN (Tour Guide variant)

**Title:** Show HN: A React Native onboarding-tour library whose spotlight auto-matches each target's shape

**First self-comment:**

I'm the author. `@wrack/react-native-tour-guide` is a React Native library for onboarding tours, walkthroughs, and coach marks that runs in Expo Go with zero native dependencies.

The reason it exists: every tour library I tried made me manually choose a spotlight shape per step, and none handled targets scrolled off screen. This one reads the border radius off the target's own style (`targetStyle`) and matches the spotlight automatically — uniform, partial, or per-corner (asymmetric bubbles included) — and auto-scrolls so the target and its tooltip both stay on screen. Tooltips auto-position so they never render off-screen.

It's under 50KB with zero native dependencies (only `react-native-svg` as a peer), so it runs in Expo Go without a custom dev build. There's a "show only once" persistence hook that takes any storage adapter (AsyncStorage, MMKV, custom), plus themes, pulse animation, pause/resume, conditional steps, custom tooltips, and accessibility announcements on by default. Full TypeScript types.

One implementation detail I'm happy with: the dark overlay is a single even-odd SVG path (a genuine punched-out hole) instead of an SVG mask, which avoids the faint white film over the highlighted element you sometimes get on the New Architecture.

Limitations: it needs the target mounted and on screen when measured; for off-screen targets you pass a `scrollRef`. No web.

Repo: https://github.com/himanshu-lal4/react-native-tour-guide
Docs: https://himanshu-lal4.github.io/react-native-tour-guide/

Happy to answer questions.

---

## Reactiflux / Expo Discord — Tour Guide (short, non-spammy)

React Native onboarding tours that run in Expo Go — in case anyone's building onboarding: I open-sourced `@wrack/react-native-tour-guide` (v1.0.1), spotlight tours/coach marks where the spotlight auto-matches each target's border radius and auto-scrolls to off-screen steps. Zero native deps (only `react-native-svg`), <50KB, so it runs in Expo Go with no dev build. Docs: https://himanshu-lal4.github.io/react-native-tour-guide/ — feedback welcome.

---
---

# BOILERPLATE BLOCKS (paste into any footer)

**react-native-liquid-glassmorphism**
> react-native-liquid-glassmorphism — authentic iOS 26 Liquid Glass for React Native on both iOS and Android: native `UIGlassEffect` on iOS 26, a real-time AGSL refraction shader on Android. npm: `react-native-liquid-glassmorphism` · Docs: https://himanshu-lal4.github.io/react-native-liquid-glassmorphism/ · Repo: https://github.com/himanshu-lal4/react-native-liquid-glassmorphism

**@wrack/react-native-tour-guide**
> @wrack/react-native-tour-guide — lightweight spotlight app tours, walkthroughs, and coach marks for React Native. Auto shape-matching spotlight, smart auto-scroll, zero native deps, runs in Expo Go. npm: `@wrack/react-native-tour-guide` · Docs: https://himanshu-lal4.github.io/react-native-tour-guide/ · Repo: https://github.com/himanshu-lal4/react-native-tour-guide

---

## Verification notes

- Code snippets in the LinkedIn/Discord posts and the boilerplate were checked against `src/` in both repos (Liquid Glass props in `src/types.ts`/`index.tsx`; Tour Guide exports in `src/index.tsx`).
- Versions verified in `package.json`: liquid-glass **1.0.0**, tour-guide **1.0.1**.
- No download counts, star counts, or other metrics cited anywhere.
- Android deep-dive blog referenced (not rewritten): `growth/blog-android-agsl-deep-dive.md`.
