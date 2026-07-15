# Integration Feedback & Issue Backlog

Feedback captured while integrating `react-native-liquid-glassmorphism@0.1.4` into a
real, production-bound app (SnoozeWar) — used as a **floating, always-mounted
bottom tab bar** (the hardest case: persistent chrome, arbitrary app content
scrolling behind it, foreground icons/labels that must stay readable).

- **Env tested:** RN 0.83.6, New Arch (Fabric), Expo prebuild (dev client),
  Android (physical Realme, ColorOS). iOS not yet exercised.
- **Source reviewed:** `android/src/main/java/com/liquidglassmorphism/LiquidGlassmorphismView.kt`
  (full read), TS types, `app.plugin.js`, README.
- **Verdict:** Engineering quality is high (9/10). Production-readiness at 0.1.4
  is ~6.5/10 — the gaps below are what stand between the two.

Line references are against `LiquidGlassmorphismView.kt` as of this review.
Pick items top-down; P0/P1 first.

---

## Quick pick list

- [x] **P0 — perf/BUG:** backdrop re-captured + view invalidated every frame, no dirty-tracking (#1) — **FIXED in 0.1.5.** This was ALSO the cause of the intermittent whole-screen ghost overlay (see corrected note below), not just a perf drain.
- [x] **P1 — feature:** legibility floor for readable chrome over `clear` glass (#2) — **DONE in 0.1.5.** New `legibilityFloor` (0–1) prop; adaptive veil under children, hued by tint.
- [x] **P1 — feature:** decouple `interactive` into touch + `tilt` (drop always-on sensor) (#3) — **DONE in 0.1.5.** New `tilt` prop; sensor registers only when on.
- [x] **P1 — dx/bug:** `interactive` no-op unless content is a **child** of the glass (#4) — **ADDRESSED in 0.1.5** via the #8 dev warning + README note (behaviour unchanged; now discoverable).
- [x] **P2 — feature:** independent edge-reflection strength (separate from `thickness`) (#5) — **DONE in 0.1.5.** New `edgeReflectionStrength` (0–1) prop; scales only the rim echo.
- [x] **P2 — feature:** expose rendered tier for QA (#6) — **DONE (logcat) in 0.1.5.** A one-time logcat line (`tier=agsl|blur|tint shaderCompiled=…`). A JS `onRender` direct event was prototyped but **removed before publish**: on RN 0.83 New-Arch, a codegen `DirectEventHandler` dispatched from a legacy Kotlin `Event` isn't registered in the JS view config (JS throws "Unsupported top level event type" for both `topOnRender` and `topRender`). Needs a proper Fabric event-registration path; the logcat line covers the QA need without shipping a broken/dead prop.
- [x] **P2 — docs:** build requirements, degradation matrix, recipes (#7) — **DONE in 0.1.5** (README).
- [x] **P3 — dx:** dev warning when `interactive`/`tilt` set with no children (#8) — **DONE in 0.1.5.**

---

## #1 — [perf + BUG] Backdrop re-captured + view invalidated every frame, and a stale first capture sticks as a full-screen ghost

**Priority:** P0 · **Type:** performance **and correctness** · **Status: FIXED (fork 0.1.5)**

**What happened:** `onPreDraw()` ran on every frame and called both
`captureBackdrop()` **and** `invalidate()`. `captureBackdrop()` does a **software**
`root.draw(canvas)` into a bitmap; `invalidate()` scheduled another draw → next
`onPreDraw` → … a self-sustaining 60fps capture+redraw loop for as long as the
view is attached, **even when the backdrop hasn't changed**.

**Two symptoms, one root cause:**
1. **Perf:** permanent CPU/GPU + battery cost on persistent chrome (tab/nav bars).
2. **Whole-screen ghost overlay (the worse one):** `invalidate()` issued from
   *inside* `onPreDraw` is unreliably coalesced by HWUI. On some devices (repro:
   physical Realme / ColorOS) the very first capture is taken mid-layout (before
   the content behind has drawn — black/partial), the follow-up repaint is
   dropped, and the glass **locks onto that stale frame**. Because the pill is an
   `absolute` overlay, the stale snapshot reads as a full-screen ghost. It only
   cleared on **detach→reattach** (background→foreground the app), because
   `onDetachedFromWindow` recycles the captured bitmap and the next attach
   re-captures. That resume-heals-it behavior is the tell.

**Fix shipped (0.1.5):**
- Dirty-track with a cheap sampled hash of the captured backdrop
  (`backdropHash()`). Only repaint when the hash changes → the self-sustaining
  loop is gone; a static screen settles and stops.
- Replace the in-`onPreDraw` `invalidate()` with **`postInvalidateOnAnimation()`**
  so the repaint reliably lands on the next frame instead of being dropped.
- A stale/black first capture now **self-heals**: when the real content finally
  draws, `onPreDraw` fires, the hash differs, and it repaints — it can't stick.
- Reset the dirty state (`haveGoodCapture`, `lastBackdropHash`) in
  `onDetachedFromWindow` so re-attach always re-captures.

**Still open (future):** the `captureBackdrop()` software `root.draw()` still runs
on every `onPreDraw` that fires (i.e. whenever *anything* in the tree
invalidates). A `captureFps` / `renderMode="onDemand"|"continuous"` prop, or
gating capture on ancestor-scroll, would cut that residual cost further.

---

## #2 — [feature] Legibility floor / content scrim for readable chrome over `clear` glass

**Priority:** P1 · **Type:** feature (highest real-world value)

**What happens:** With `variant="clear"` over arbitrary app content, foreground
children (icons, labels) become unreadable — the glass faithfully transmits
whatever is behind it (bright cards, refracted body text), and there is no
built-in affordance to keep the *foreground* legible. Every integrator has to
reinvent this (I added a tint floor, per-glyph shadow halos, and an opaque
"selected" chip by hand).

**Proposed fix:** A `legibilityFloor` (0–1) or `scrim` prop that lays a uniform,
adaptive surface **behind foreground children only** (not a global tint that
darkens the whole pane). Bonus: an adaptive/auto mode that lifts the floor based
on measured backdrop luminance so chrome stays readable on both dark and bright
backgrounds without manual tuning.

**Why it matters:** This is the difference between "beautiful demo over a photo"
and "usable over a real app." It bit me on the very first screen.

---

## #3 — [feature] Decouple `interactive` into `touchResponse` + `tilt`

**Priority:** P1 · **Type:** feature / battery

**What happens:** `interactive` bundles two effects: touch-magnify/bloom **and**
device-tilt specular. The tilt effect registers a continuous gravity/accelerometer
listener at `SENSOR_DELAY_GAME` (`setInteractiveValue` ~159 → `registerSensor` ~562,
`registerListener(..., SENSOR_DELAY_GAME)` ~567). You cannot get touch response
without also running an always-on motion sensor.

**Why it matters:** On an always-mounted component the sensor runs the entire
time the app is foregrounded — battery cost for an effect users may never notice.
I wanted touch-magnify but not a permanent sensor, and there's no way to split them.

**Proposed fix:** Separate props, e.g. `touchResponse?: boolean` and
`tilt?: boolean` (keep `interactive` as a convenience alias for both, for
back-compat). Only register the sensor when `tilt` is on.

---

## #4 — [bug/dx] `interactive` silently does nothing unless content is a child of the glass

**Priority:** P1 · **Type:** correctness / docs

**What happens:** The touch effects are driven by the view's `dispatchTouchEvent`
(~line 375), so touches only reach them if foreground content is rendered as a
**child** of `<LiquidGlassView>`. A common layout — glass as an `absoluteFill`
background with the interactive content as a **sibling on top** — receives no
touches, so `interactive` is a silent no-op with no error or warning. I lost time
here and only found it by reading the native source.

**Proposed fix:** Document the children requirement prominently, and/or make the
manager observe touches at a level that works for the sibling-overlay pattern.
At minimum, pair with #8 (dev warning).

---

## #5 — [feature] Independent `edgeReflection` control (separate from `thickness`)

**Priority:** P2 · **Type:** feature

**What happens:** The top/bottom edge-reflection band folds the backdrop back on
itself (`reflDisp = n2 * reflMask * (iLens * 3.0)`, ~line 728). Over **text**
backdrops this mirrors body copy into upside-down noise inside the surface. The
only lever is `thickness`, which also scales `iLens` (line 504) and therefore the
whole lens — you can't calm the reflection without flattening the glass.

**Why it matters:** The effect is tuned for photo/video backdrops; over text-heavy
UI the reflection reads as garbage. Had to drop `thickness` globally to hide it,
losing lens depth I wanted to keep.

**Proposed fix:** `edgeReflection?: boolean` and/or `edgeReflectionStrength?: number`
so the reflection band can be dampened/disabled independently of `thickness`.

---

## #6 — [feature] Expose the rendered tier for QA (`onRender` callback / `shaderActive`)

**Priority:** P2 · **Type:** feature / observability

**What happens:** The lib degrades across four tiers (iOS 26 glass / Android API
33+ AGSL / API 31–32 blur / <31 tint). Internally it knows which ran
(`shaderActive` — line 98, set true at ~517, false at ~482/520; `glassShader` may
be null if AGSL fails to compile, ~111–115), but nothing is surfaced to JS.

**Why it matters:** Across a real device matrix I can't programmatically confirm
the shader even compiled on a given phone, so I can't tell "looks flat because
fallback" from "looks flat because misconfigured." Blind spot for QA and telemetry.

**Proposed fix:** An `onRender?: (info: { tier: 'ios-glass' | 'agsl' | 'blur' | 'tint'; shaderCompiled: boolean }) => void`
callback, or a queryable ref method.

---

## #7 — [docs] Build requirements, degradation matrix, and integration recipes

**Priority:** P2 · **Type:** docs

Gaps I hit:
- **Build toolchain:** my first Android build failed needing NDK `27.1.12297006`,
  and Gradle's in-build auto-install of it flaked. Whether the lib pins/needs a
  specific NDK or min compile SDK isn't documented. State the exact
  compileSdk/NDK expectations (the AGSL `RuntimeShader` + `RenderNode` path needs
  a recent toolchain).
- **Degradation matrix:** document *exactly* what each fallback tier looks like
  (esp. Android 8–12: "blur + tint, no refraction") so integrators set
  expectations for their min-SDK users.
- **Recipes:** a "readable chrome over clear glass" example (the #2 pattern), and
  a note on the children-nesting requirement for `interactive` (#4).

---

## #8 — [dx] Warn in dev when `interactive` is set but the view has no children

**Priority:** P3 · **Type:** developer experience

Cheap guard for the #4 footgun: if `interactive` (or the future `touchResponse`)
is enabled and the view has zero children, emit a dev-only warning explaining the
children requirement. Turns a silent no-op into a one-line fix.

---

## What's genuinely good (keep it)

- **Real Android liquid glass** via a hand-rolled AGSL refraction shader (SDF →
  lens profile → chromatic dispersion → Fresnel rim → medial-axis seam fade → edge
  guard). Reproduces iOS 26 optics where Android has no system equivalent.
- **Careful, artifact-aware implementation** — software capture to dodge HWUI
  stack-overflow from RenderNode tree refs; CPU-precomputed normals to avoid
  per-texel shatter; the edge-guard against "cracked glass" fringe. Someone
  clearly iterated on-device.
- **Graceful 4-tier degradation** across OS versions.
- **Clean, well-documented TS API** (JSDoc on every prop); New-Arch ready; small,
  sensible surface. Config plugin as an honest no-op pass-through.

---

## Notes / non-issues

- The **"whole-screen overlay"** I initially suspected was **our** integration
  (an opaque tint + a dark fade band), **not** the library. The capture path is
  correctly scoped to the view's own bounds — no full-screen bug found.
- `intensity` being iOS-managed above iOS 26 (used only for the pre-26 fallback)
  is documented and fine.
- Custom-shape stretch (`preserveAspectRatio="none"`) is documented; match the
  view aspect ratio. Fine.
