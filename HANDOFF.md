# HANDOFF — react-native-liquid-glassmorphism

> Resume doc for continuing this library in a fresh session (any account).
> All source is already on disk in this repo's working tree.
> Last updated 2026-06-27 — **iOS DONE & user-signed-off; Android (Phase 3) is next.**

## Goal
Bring **authentic iOS 26 Liquid Glass** to React Native, "very easily and lightweight."
The hard/important half is **Android parity** (no native Liquid Glass exists there) — that is
the differentiator and the main remaining work.

## Locked decisions
- **Native Fabric component** (Swift/ObjC++ iOS + Kotlin Android). NOT pure-JS.
- **Both old + new architecture** (codegen ViewManager delegate covers both).
- **Ship an Expo config plugin** (Expo Go unsupported; dev build / prebuild).
- **Public API:** `<LiquidGlassView>` (not the internal codegen name).
- **Baseline:** RN 0.83.6, React 19.2, yarn 4.11, Xcode 26 / iOS 26 SDK.
- Tooling **mirrors the sibling lib** `../react-native-tour-guide` (eslint flat config,
  prettier, tsconfig, babel, jest, release-it, commitlint/husky, builder-bob module+typescript).
- npm name already reserved; placeholder was `0.0.1-dev.0`, this work bumps to `0.1.0`.

## Public API (implemented)
```tsx
import { LiquidGlassView } from 'react-native-liquid-glassmorphism';

<LiquidGlassView
  variant="regular"      // 'regular' | 'clear'  -> iOS 26 UIGlassEffect styles
  tintColor="#FFFFFF"
  intensity={60}         // 0–100 blur/material strength (fallback + Android)
  interactive            // iOS 26 interactive glass + Android touch specular
  borderRadius={24}
  refraction             // Android AGSL edge-lensing (no-op iOS)
>{children}</LiquidGlassView>
```
Internal codegen component name stays `LiquidGlassmorphismView`.

## Status by phase
- [x] **Phase 1 — Skeleton + JS API.** package.json (merged scaffold codegen + tour-guide
      toolchain), all configs, `src/` (index, types, native+web wrappers, codegen spec).
      `tsc` ✅ and `bob build` ✅ both pass.
- [x] **Phase 2 — iOS native. ✅ COMPLETE & user-signed-off ("iOS is working perfectly fine").**
      `ios/LiquidGlassmorphismView.mm` — real `UIGlassEffect` (iOS 26, SDK-guarded
      `__IPHONE_26_0`) + `UIBlurEffect` fallback, native tint, corner radius.
      **Verified end-to-end: `BUILD SUCCEEDED` + runs on iPhone 17 Pro sim, glass renders
      authentically** (multiple screenshots reviewed). Three bugs fixed during verification:
      (1) `clear` variant was ignored — now uses `[UIGlassEffect effectWithStyle:]`
      (regular/clear); (2) children were blurred — now hosted in `_effectView.contentView`
      (Apple-canonical crisp content layer) via a `mountChildComponentView` override, and
      the effect is mutated in place (`_effectView.effect = …`); (3) glass looked like flat
      frost — fixed with iOS-26 `UICornerConfiguration`/`UICornerRadius` (preserves edge
      lensing/specular) instead of a hard `layer.cornerRadius` clip. Space-in-path blocker
      permanently resolved: parent folder renamed `Node Libraries` → **`Node-Libraries`**.
      JS prop-mapping covered by jest (14 tests in `src/__tests__/`), typecheck + lint clean.
      Example gallery (`example/src/App.tsx`) showcases every variant/type — variants,
      tinted chips, interactive switches, shapes (pill/circle/card), intensity ramp, glass
      buttons, and an empty macOS-dock-style clear-glass tray — over an Apple wallpaper
      backdrop (`example/assets/wallpaper.png`, an iOS-26 fanned-blades image, `resizeMode="stretch"`
      so the whole image fills the viewport). NOTE: `expo-linear-gradient` was added to the
      example then superseded by the image — unused now; remove from `example/package.json` +
      re-`pod install` if you want it gone. NOTE: nothing is committed yet — whole tree is
      still untracked; consider an initial commit before starting Android.
- [x] **Phase 3 — Android native. ✅ FIRST PASS COMPLETE — builds + renders on emulator
      (API 34, tourdemo AVD) with real backdrop blur.** Android has no native in-app backdrop
      blur, so `LiquidGlassmorphismView.kt` (now a `ReactViewGroup`) reproduces it:
      - **Backdrop capture** — an `OnPreDrawListener` snapshots the view hierarchy *behind*
        this view each frame into a downscaled bitmap (excludes self via an `isCapturing`
        guard in `draw()`), so children stay crisp on top.
      - **RenderEffect blur** (API 31+) on a `RenderNode`, radius bucketed by `intensity`
        (lighter for `clear`) — see pure `GlassParams` (JVM-unit-tested, 9 tests).
      - **AGSL `RuntimeShader` edge-refraction** (API 33+, gated by `refraction` prop),
        chained behind the blur; wrapped in try/catch → falls back to blur-only on shader fail.
      - **Canvas tint wash + specular sheen + 1px rim**; specular slides with the gyroscope
        (`SensorManager`, GAME_ROTATION_VECTOR→ACCELEROMETER fallback) when `interactive`.
      - **< API 31 fallback:** translucent tint + rim, no blur.
      - Manager is now a `ViewGroupManager` implementing the generated
        `LiquidGlassmorphismViewManagerInterface` (setVariant/TintColor/Intensity/Interactive/
        GlassCornerRadius/Refraction). All props wired.
      Verified: `:react-native-liquid-glassmorphism:testDebugUnitTest` green, `assembleDebug`
      BUILD SUCCESSFUL, installed on emulator-5554, gallery renders (screenshots compared to iOS).
      **Refinements still open (polish, not blockers):** (1) `regular` tint reads darker/flatter
      than iOS — add a brighter "frost floor" so the material lightens like UIGlassEffect;
      (2) tinted chips read more opaque than iOS's vibrant-adaptive tint; (3) specular subtler
      than iOS. Capture-blur recaptures every frame (fine for demo; consider throttling/dirty-flag
      for production perf).
- [ ] **Phase 4 — Expo config plugin.** Create `app.plugin.js` + `plugin/` source.
      (`files` and `exports` in package.json already reference them.)
- [ ] **Phase 5 — Example screens, README, llms.txt, jest tests, final validation.**
      Example app at `example/` (Expo) with demo in `example/src/App.tsx`.

## Key files
- `src/LiquidGlassmorphismViewNativeComponent.ts` — codegen spec (source of truth for props)
- `src/LiquidGlassView.native.tsx` / `.tsx` — native wrapper / web fallback
- `src/types.ts` — public `LiquidGlassViewProps`, `GlassVariant`
- `ios/LiquidGlassmorphismView.{h,mm}` — iOS Fabric view (DONE)
- `android/src/main/java/com/liquidglassmorphism/*.kt` — Android (STUBS, TODO)
- `LiquidGlassmorphism.podspec`, `android/build.gradle` — native build config
- `package.json` → `codegenConfig` (name `LiquidGlassmorphismViewSpec`, type `all`)

## How to build / validate
Yarn 4 is bundled; invoke via node (system `yarn` is classic 1.22 and won't respect yarnPath):
```
node .yarn/releases/yarn-4.11.0.cjs install
node .yarn/releases/yarn-4.11.0.cjs typecheck
node .yarn/releases/yarn-4.11.0.cjs build       # bob build
```
Verify native codegen without a full app build:
```
node node_modules/react-native/scripts/generate-codegen-artifacts.js \
  --path . --outputPath /tmp/cg --targetPlatform ios   # (or android)
# check /tmp/cg/build/generated/ios/ReactCodegen/.../Props.h
```
Run the example (iOS):
```
cd example
node node_modules/expo/bin/cli prebuild -p ios --no-install --clean
cd ios && pod install && cd ..
node node_modules/expo/bin/cli run:ios
```

## ⚠️ Environment gotchas (these cost real time — read before building)
1. **Project path contains a space** (`/Users/wrack/Desktop/Node Libraries/...`). This BREAKS
   Expo/RN iOS build script phases (e.g. EXConstants: `bash: /Users/wrack/Desktop/Node: No such
   file or directory`). **Fix: rename the parent folder to `Node-Libraries`** (or move repo).
   Our own code compiled fine; only third-party script phases choke on the space.
2. **Disk was full** (245 GB used of 245 GB → ENOSPC). iOS builds need many GB. Clear:
   `~/Library/Developer/Xcode/DerivedData/*`, `xcrun simctl delete unavailable`,
   `~/Library/Developer/CoreSimulator` old runtimes, yarn/npm/CocoaPods caches.
3. **Global legacy `expo-cli` hijacks `expo`** (broken on Node 22 — "Dependency map is invalid").
   Always use the local CLI: `node node_modules/expo/bin/cli ...`.
4. **RN 0.83 prebuilt ReactNativeCore tarball extraction fails on paths with spaces**
   ("bad component"). Workaround if you must build at the space path: build RN from source with
   `RCT_USE_RN_DEP=0 RCT_USE_PREBUILT_RNCORE=0 pod install` (slow). On a space-free path the
   default prebuilt path works and is much faster.
5. Don't copy the repo into a small `/tmp`/sandbox volume to build — full RN iOS build is several
   GB and will ENOSPC. Build on the main disk in a space-free folder.

## Reference: how the iOS native maps props
- `variant` → codegen enum `LiquidGlassmorphismViewVariant{Regular,Clear}`
- iOS 26+: `UIGlassEffect` (`interactive`, `tintColor`); else `UIVisualEffectView` +
  `UIBlurEffect` material bucketed by `intensity`.
- `glassCornerRadius` → layer cornerRadius (continuous curve) on container + effect view.

## Next action when resuming
iOS done + signed off; Android first pass done + rendering on emulator. Options:
1. **Polish Android glass to match iOS** (recommended): brighter "frost floor" for `regular`
   (lighten the blurred backdrop, not just white-wash), more vibrant/less-opaque tints,
   stronger specular. Iterate via `assembleDebug` → adb install → screencap on emulator-5554.
2. **Commit the Android milestone** (nothing past the iOS commit `905e2f1` is committed yet).
3. **Phase 4 — Expo config plugin** (`app.plugin.js` + `plugin/`).
4. **Phase 5 — README / llms.txt / final validation.**

### How to rebuild + redeploy Android quickly
```
cd example/android && ./gradlew :app:assembleDebug --console=plain
adb -s emulator-5554 install -r -d app/build/outputs/apk/debug/app-debug.apk
adb -s emulator-5554 reverse tcp:8081 tcp:8081   # if Metro restarted
adb -s emulator-5554 shell am start -n liquidglassmorphism.example/.MainActivity
adb -s emulator-5554 exec-out screencap -p > /tmp/and.png
```
Run library unit tests: `cd example/android && ./gradlew :react-native-liquid-glassmorphism:testDebugUnitTest`
Emulator boot: `$ANDROID_HOME/emulator/emulator -avd tourdemo` (API 34, supports RenderEffect+AGSL).
A physical API-36 device (`192.168.1.2:39583`) is also available as an alternate target.
