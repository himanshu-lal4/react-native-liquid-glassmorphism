# Architecture

Why the internals are shaped the way they are. This covers the decisions that
cost real time to rediscover — the traps, and the reasons a more obvious
implementation was rejected.

For the public API see the [README](./README.md) and the
[API reference](https://himanshu-lal4.github.io/react-native-liquid-glassmorphism/api/).

---

## The tier model

There is no single implementation. The library picks the richest path the OS can
run and degrades on a documented ladder:

| Tier | Platform | What renders |
| --- | --- | --- |
| `glass` | iOS 26+ | Apple's `UIGlassEffect` — the OS draws the material |
| `refraction` | Android 13+ (API 33) | Our AGSL `RuntimeShader` over a per-frame backdrop capture |
| `blur` | iOS 15–25 · Android 12 (API 31–32) | `UIBlurEffect` material · `RenderEffect` blur + tint |
| `tint` | Android < API 31 | Translucent tint with a rim, no blur |
| `none` | Web | Non-glass fallback |

`minSdk` is 24. Two entry points expose this: `getGlassCapabilities()` answers
*before* anything mounts (use it to decide whether to render glass at all), and
`onPipelineReady` reports what a mounted view *actually* did, which is not
always the same thing — a shader that fails to compile falls back a tier and
says so via `onError`.

---

## Android

Everything below lives in
`android/src/main/java/com/liquidglassmorphism/LiquidGlassmorphismView.kt` and
`GlassSdf.kt`.

### The capture loop, and the HWUI trap

Android has no system glass material and no way to read the framebuffer behind a
view. So, by default, the glass captures its backdrop: a full software
`rootView.draw(canvas)` into a bitmap shared by every glass view under the same
root (`SharedBackdrop`), driven from an `OnPreDrawListener`. The GPU alternative
is the layer backdrop, described below.

The naive version of this **self-sustains at 60fps forever**. Capturing marks
the view dirty, the invalidation schedules a draw, the draw fires `onPreDraw`,
which captures again. A static screen burns a full software root draw every
frame with nothing changing.

Two things fix it, and both are load-bearing (`onPreDraw`, ~line 580):

**1. A sampled backdrop hash gates the repaint.** The capture still happens, but
the view only repaints when the hash differs. On a static screen the hash
settles and the loop stops. When content behind scrolls or animates, `onPreDraw`
fires from *that* invalidation, the hash differs, and we repaint exactly one
fresh frame.

**2. The repaint is scheduled outside the draw pass.**

```kotlin
// invalidate() issued from within onPreDraw is unreliably coalesced by HWUI —
// that dropped repaint is what let a stale/black first capture stick as a
// full-screen ghost. postInvalidateOnAnimation() reliably lands on the next frame.
postInvalidateOnAnimation()
```

This is the single nastiest trap in the codebase. `invalidate()` from inside
`onPreDraw` *looks* correct and works most of the time; when HWUI coalesces it
away, the first (often black) capture sticks as a full-screen ghost. If you are
debugging a stale or black backdrop, start here.

### Why the capture is not throttled

It looks like obvious low-hanging fruit: cap the capture at 30fps and halve the
cost. **It was tried and it made things visibly worse on device.** The capture
is already gated by the hash, so on a static screen it costs nothing; on a
moving screen, a throttled backdrop lags visibly behind the content it is
supposed to be refracting, and the lag reads as the glass being broken rather
than as a lower frame rate.

Don't re-add it without measuring on a real device. The right fix for the cost
is sharing one capture across all views ([#38](https://github.com/himanshu-lal4/react-native-liquid-glassmorphism/issues/38)),
not sampling it less often.

### Suspension

`onVisibilityAggregated` covers the cases Android already knows about — a screen
pushed on top, an inactive tab, a backgrounded app — and suspends capture for
all of them without the app wiring anything up. The `paused` prop exists only
for the cases that signal cannot see: a screen a navigator keeps alive, an
off-screen carousel page.

Resuming clears `haveGoodCapture` as well as the hash, which is what forces a
repaint even when the backdrop happens to hash identically to the frame we froze
on.

### The layer backdrop (`LiquidGlassBackdropView`)

The software capture is the fallback. Inside a `<LiquidGlassBackdrop>` the glass
never sees a bitmap: the host records its children into a `RenderNode` and each
glass view draws that node into its effect layer, through the inverse of its own
placement. Nothing is rasterised on the CPU, so a scroll under the glass costs
nothing on our side — the display list already points at the live content.

The shape of a frame, in `LiquidGlassBackdropView.dispatchDraw`:

1. Record the children into the backdrop node with `recording` set. Every glass
   view's `draw()` returns early, so no glass is in its own backdrop.
2. Collect every glass descendant in tree order — nested ones included.
3. Build a composite chain: `composite[k]` = `composite[k-1]` + glass `k`, drawn
   inline through the ancestor chain's placement, transforms and clips. Glass
   `k` samples `composite[k-1]`. That is what gives glass on glass and keeps a
   scaled pane's backdrop still.
4. Draw the last composite.

Three rules keep this from crashing, and all three were learned from a
`SIGSEGV` on the render thread — HWUI walks a cyclic node graph until the stack
overflows, and the emulator's crash dumper cannot even produce a backtrace
without `adb root`:

- **Glass draws exactly once, explicitly.** While the host is compositing, a
  glass view reached through the tree (its own display list, or a parent
  glass's children) draws nothing; only the host's call with `drawingFromHost`
  set renders. Otherwise a nested glass is drawn twice, and the tree copy's
  effect node ends up inside the composite it samples.
- **The layer path has its own `RenderNode`.** A display list recorded through
  the tree during a bitmap-path frame may still reference `effectNode`; if the
  explicit draw re-recorded that same node to reference the backdrop, the
  backdrop would contain a node that draws the backdrop. `layerNode` is never
  referenced by anything recorded through the tree.
- **A software pass does not change the mode.** The shared bitmap capture runs
  `rootView.draw()` on a software canvas through the host every frame that any
  glass *outside* it needs a capture. Flipping `layerActive` there let glass
  views record real content between two composited frames. Only a software
  draw that is not the capture drops the host out of layer mode.

Because the glass is drawn from the host's display list, the host must
re-record when a glass *moves* inside it (a scroll, a transform). Nothing in
the view system re-records a parent for that, so each glass compares its
host-relative matrix in `onPreDraw` and invalidates the host when it changed,
returning `false` to re-run the traversal in the same frame.

### Blur padding

The effect node is grown by the blur radius on every side that has content to
give (`paddedSrcRect` for the bitmap path, the host bounds for the layer path).
Blurring a capture cropped to exactly the view with `CLAMP` averages the edge
pixels into the outer ring — a streak along every border. The shader is told
the offset (`iOffset`) and crops the margin back, so nothing draws outside the
view.

### The SDF texture

Custom shapes are the interesting part. The shader treats an arbitrary silhouette
exactly the way it treats the analytic rounded-rect: sample a signed distance
`d`, take its gradient for the surface normal, and drive lensing, rim, dispersion
and the medial-axis seam-fade off both.

`GlassSdf.build()` rasterises the path anti-aliased at a capped resolution, seeds
sub-pixel contour offsets from the coverage, runs an exact Euclidean distance
transform (Felzenszwalb & Huttenlocher's O(n) 1-D DT, once per axis), signs it by
the coverage, and packs the result.

Four decisions here exist because the obvious version produced *shattered glass*:

**Distance is a single 8-bit channel, with a square-law encoding.**

```
u       = sign(d) · sqrt(min(1, |d| / range))
encoded = 0.5 + u · 0.5          (R channel)
d       = u · |u| · range        (decode, in-shader)
```

The obvious improvement — a 16-bit fixed-point distance split across red and
green — was tried and **tears** wherever the low byte wraps, because hardware
bilinear blends the two bytes independently and `FILTER_MODE_NEAREST` is not
reliably honoured through `RenderEffect` child sampling. `RGBA_F16` fares no
better: emulator and driver translation layers quantise it back to 8-bit.

A monotone 8-bit ramp interpolates cleanly under *any* filtering, and the square
law buys back the precision where it matters — the first 3px from the edge span
~15 codes instead of 2, while the far field, which only feeds broad band masks,
gives up precision it never needed. G and B carry the lens rim and mirror band
ramps, precomputed in float and dithered.

**Normals are computed on the CPU, in float, from the smoothed field** — not by
differentiating the packed texture in the shader. Differentiating an 8-bit-ish
packed texture in-shader leaves per-texel direction wobble that the mirror term
amplifies into radial streaks. The `grad` bitmap carries `R/G` = unit gradient
(0.5-centred) and `B` = gradient magnitude, used as medial-axis confidence.

**The edge alpha comes from a separate full-resolution coverage mask**, not from
the SDF. Skia's anti-aliased path rasterisation gives a crisp edge comparable to
a `CAShapeLayer` mask; an alpha edge derived from the coarse SDF wobbles
per-texel and reads as a serrated, broken outline.

**Working resolution is capped at 1024, not 512.** At 512 a full-width bar's
normals jitter per-pixel and the refraction reads as shattered. 1024 keeps SDF
texels ≈1 view px even for a full-width shape.

Related: `GRAD_RADIUS = 3`. The normal is differenced over ±3 texels rather than
±1. Because `dist` is very nearly an exact distance field, `|grad|` is ~1
everywhere and collapses only within a texel or two of the medial axis — along a
polygon's angle bisectors that left a narrow band where confidence sat mid-range
(lens still partly on) while direction was pure noise, displacing samples by tens
of pixels in an arbitrary direction. That is why a triangle's corners used to
render wallpaper from the top of the screen.

### Anti-aliasing and `clipPath`

`Canvas.clipPath` is **not** anti-aliased on a hardware canvas — it is a hard
per-pixel stencil. The shader already derives a smooth silhouette alpha from the
full-resolution mask, so clipping on top saws that edge back off. The clip is
therefore applied only where the shader is *not* running: the blur-only fallback
below API 33, where nothing else bounds the render node.

The rounded rectangle is not rounded by the view's `clipToOutline` either. A
view-level clip also clips the background drawable, which is where React
Native paints a `boxShadow`, so an outset shadow was simply cut off. Instead the
effect node and a node the children are recorded into (`childrenNode`) each
carry a `RenderNode` outline with `clipToOutline` — the same anti-aliased
rounding, minus the side effect. The corner radius is also handed to
`BackgroundStyleApplicator` so RN's shadow follows the pane's corners.

---

## iOS

In `ios/LiquidGlassmorphismView.mm`.

### Effect selection

Three paths, in priority order:

1. **Plain-blur mode** — when `rim`, `specular` are off and `thickness` is `0`,
   the app is telling us it does not want Liquid Glass. Returns a `UIBlurEffect`
   whose material is bucketed from `blurRadius` if set, otherwise from
   `intensity`. UIKit's materials are discrete, so this is the nearest
   equivalent to a radius, not a literal one.
2. **iOS 26+** — a real `UIGlassEffect`.
3. **Below iOS 26** — a `UIBlurEffect` material whose heaviness tracks
   `intensity` (`≥80` thick, `≥50` regular, `≥25` thin, else ultraThin);
   `clear` always maps to ultraThin.

### The `cornerConfiguration` segfault

On iOS 26, mutating `cornerConfiguration` on a `UIGlassEffect` view **during the
initial mount, before layout, segfaults inside UIKit.**

Corner handling therefore forks (~line 477):

- **With a custom `shape`**, the silhouette is defined entirely by the
  `CAShapeLayer` mask in `-applyShapeMask`, so we deliberately never touch
  `cornerConfiguration`. Corner radius is squared off and the mask does the
  shaping.
- **Without a shape** on iOS 26, we *do* set a `UICornerConfiguration`, because
  it lets `UIGlassEffect` render its rounded shape *with* the proper edge lensing
  and specular. A hard `layer.cornerRadius` + `clipsToBounds` would shave those
  refractive edges off — which is exactly what made the glass look like flat
  frost before.

Note the asymmetry: `self.clipsToBounds = YES` to clip children to the rounded
shape, but `_effectView.clipsToBounds = NO` so the glass can draw its full edge
treatment outside those bounds.

### Debugging a native crash

Crashes here surface as a `.ips` file, not a JS stack trace:

1. Reproduce, then pull the `.ips` from the device (Settings → Privacy &
   Security → Analytics & Improvements → Analytics Data, or the Xcode Devices
   window).
2. Find the frame in our binary and symbolicate it with `atos` **against the
   debug dylib** — the stripped release binary will not resolve:

   ```sh
   atos -o /path/to/LiquidGlassmorphism.framework/LiquidGlassmorphism \
        -arch arm64 -l <load address> <frame address>
   ```

3. A UIKit frame with no symbols of ours near the top usually means we mutated
   OS state at a moment it did not expect — `cornerConfiguration` above is the
   known instance of that class of bug.

---

## Both platforms

**Touch and tilt need foreground content to be a child.** The effects are driven
by this view's own `dispatchTouchEvent`, so a sibling overlay positioned on top
silently defeats them. The Android side warns once at dev time rather than
letting it cost debugging time.

**Errors are reported, not thrown.** `onError` fires at most once per code per
view, and most codes are non-fatal — the view recovered but is not rendering
exactly what the props describe. `SHADER_COMPILE_FAILED`, `PIPELINE_DEGRADED`,
`INVALID_SHAPE`, `BACKDROP_CAPTURE_FAILED`, `GLASS_UNAVAILABLE`.

**Presets are resolved in JS**, as `{ ...preset, ...props }` with `undefined`
values skipped — so `variant={cond ? 'clear' : undefined}` does not knock out the
preset's value. A preset describes the material only: never `shape`, `style` or
`children`.

---

## Contributing

The Android tuning loop is a gradle build → `adb install` → screenshot cycle of
roughly 8 seconds. Shader changes want a real device; the AGSL path needs API 33+
and an emulator's GPU is not representative of what the effect looks like in
someone's hand.
