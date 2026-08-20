# Contributing

Thanks for your interest in improving **react-native-liquid-glassmorphism**! Issues, ideas, and pull requests of every size are welcome — bug reports, docs, and examples help just as much as features.

New here? Browse the [**good first issues**](https://github.com/himanshu-lal4/react-native-liquid-glassmorphism/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) — they're scoped to be a friendly starting point.

## Project layout

```
src/                 # TypeScript: <LiquidGlassView> wrapper, types, custom-shape math
  shapes.ts          # normalizes every `shape` prop to an SVG path + view-box
  __tests__/         # Jest tests
ios/                 # Swift/ObjC++ — UIGlassEffect (iOS 26) + blur fallback
android/             # Kotlin — RenderEffect + AGSL refraction shader
example/             # Expo gallery app that exercises every prop
docs/                # Jekyll docs site (GitHub Pages)
```

The public component is `<LiquidGlassView>`; the internal codegen name is `LiquidGlassmorphismView`.

**Before changing anything native, read [ARCHITECTURE.md](./ARCHITECTURE.md).** It
covers the decisions that are not obvious from the code — why the Android repaint
is scheduled with `postInvalidateOnAnimation()` rather than `invalidate()`, why the
per-frame capture is deliberately not throttled, why the SDF carries a 16-bit
distance with CPU-computed normals, and the iOS 26 `cornerConfiguration` segfault.
Each of those has a wrong-but-plausible alternative that was tried first.

## Local setup

This repo uses **Yarn 4** (pinned via `packageManager`). Enable Corepack once, then install:

```sh
corepack enable
yarn install
```

Common checks (run before opening a PR):

```sh
yarn typecheck     # tsc
yarn lint          # eslint (yarn lint:fix to autofix)
yarn test          # jest
yarn prepare       # build the library with react-native-builder-bob
```

### Running the example app

The effect needs a native build — **Expo Go won't work**. Use a dev build:

```sh
cd example
npx expo run:ios       # requires Xcode 26 / iOS 26 SDK for native Liquid Glass
npx expo run:android   # requires Android 13 (API 33+) for the AGSL shader
```

Older OS versions fall back to blur/tint automatically, so you can develop on them too.

## Pull requests

1. Fork and branch from `main` (e.g. `feat/star-shape`, `fix/…`, `docs/…`).
2. Keep the change focused; add/update tests for `src/` changes.
3. Make sure `yarn lint && yarn typecheck && yarn test && yarn prepare` all pass.
4. Use [Conventional Commits](https://www.conventionalcommits.org/) for the PR title (`feat:`, `fix:`, `docs:`, `chore:`, …) — the changelog is generated from them.
5. Open the PR against `main` and describe what you changed and how you verified it (a simulator/emulator screenshot for visual changes is great).

Docs-only PRs (`docs/`, `README.md`, `growth/`) skip the native builds in CI automatically.

## Reporting bugs

Open an [issue](https://github.com/himanshu-lal4/react-native-liquid-glassmorphism/issues/new) with your RN version, platform + OS version, and a minimal repro. For visual glitches, a screenshot or short screen recording helps a lot.

By contributing, you agree that your contributions are licensed under the [MIT License](./LICENSE).
