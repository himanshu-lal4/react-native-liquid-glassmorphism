> **Claim discipline.** Do not write "the only library with real glass on Android" —
> `@uginy/react-native-liquid-glass` and `react-native-android-liquid-glass` both ship
> AGSL on Android, and a reviewer who knows that will discount everything else you say.
> The claim that survives scrutiny is **merging**: Callstack's container is twenty lines
> around Apple's `UIGlassContainerEffect` and their package has no Android at all.

# Awesome-list & directory submissions (ready to paste)

The highest-ROI backlinks you can get. These lists are scraped and cited by both search and LLMs.

---

## 1. `awesome-react-native` (jondot/awesome-react-native)

**Repo:** https://github.com/jondot/awesome-react-native
**Section:** `## Components` → **UI** (or the closest "Blur / Glass / Visual effects" grouping — search the README for "blur", "glass", "vibrancy"; place it near any blur/visual-effect entries).

**Entry (single markdown line — match the list's existing format):**

```markdown
- [react-native-liquid-glassmorphism](https://github.com/himanshu-lal4/react-native-liquid-glassmorphism) - Liquid Glass on iOS *and* Android, with glass views that merge into one liquid body on contact — native UIGlassEffect + UIGlassContainerEffect on iOS 26, AGSL refraction and smooth-min merging on Android. Custom shapes, Expo config plugin, TypeScript.
```

> Check `CONTRIBUTING.md` in that repo first — some awesome lists require the entry to be trailing-period-consistent, alphabetized, and to pass `awesome-lint`. Keep the description under ~15 words if they enforce it. Short form if needed:
> `- [react-native-liquid-glassmorphism](...) - Liquid Glass for iOS 26 and Android with merging glass views (UIGlassEffect + AGSL refraction), custom shapes, Expo.`

**PR title:**
```
Add react-native-liquid-glassmorphism (Liquid Glass for iOS 26 + Android, with merging)
```

**PR body:**
```
Adds react-native-liquid-glassmorphism — authentic Liquid Glass for React Native on both iOS and Android.

- iOS 26: Apple's native UIGlassEffect (UIBlurEffect fallback below 26)
- **Glass that merges** — two or more glass views fuse into one liquid body as they approach, on BOTH platforms. iOS uses Apple's UIGlassContainerEffect; Android has no OS equivalent, so the bodies are smooth-min merged per pixel in an AGSL shader. No other RN library does merging on Android
- Android: a real-time AGSL refractive-lens shader (edge refraction, chromatic dispersion, mirrored edge reflection, Fresnel rim, tilt/touch specular)
- `<ScrollEdgeBlurView>` — progressive edge blur for content under a header, both platforms
- `accessibilityMode` — honours Reduce Transparency / Reduce Motion on both platforms
- Zero runtime dependencies; published with npm provenance
- Custom shapes (circle/squircle/polygon/points/arbitrary concave SVG path)
- Interactive touch + device-tilt specular
- Expo config plugin, New Architecture (Fabric) + old architecture, TypeScript

npm: https://www.npmjs.com/package/react-native-liquid-glassmorphism
Repo: https://github.com/himanshu-lal4/react-native-liquid-glassmorphism

Placed alphabetically in the [section] group. Passes awesome-lint.
```

---

## 2. Other lists worth a PR (same entry line, adjust section)

- **`awesome-react-native-ui`** (madhavanmalolan/awesome-reactnative-ui) — UI components.
- **`awesome-expo`** (expo-community) — the Expo config plugin + prebuild support qualifies it.
- **`awesome-ios`-style RN roundups** — anywhere "iOS 26 / Liquid Glass" is being catalogued.

---

## 3. reactnative.directory (JSON)

**Submit at** https://github.com/react-native-community/directory — add an object to `react-native-libraries.json` (keep the file's ordering/format):

```json
{
  "githubUrl": "https://github.com/himanshu-lal4/react-native-liquid-glassmorphism",
  "npmPkg": "react-native-liquid-glassmorphism",
  "examples": [
    "https://github.com/himanshu-lal4/react-native-liquid-glassmorphism/tree/main/example"
  ],
  "images": [
    "https://github.com/himanshu-lal4/react-native-liquid-glassmorphism/releases/download/v0.1.0/reel-ios.gif",
    "https://github.com/himanshu-lal4/react-native-liquid-glassmorphism/releases/download/v0.1.0/reel-android.gif"
  ],
  "topics": ["liquid-glass", "glassmorphism", "blur", "glass-effect", "ios26", "agsl", "expo", "new-architecture"]
}
```

> The directory auto-fetches stars, downloads, and platform support from GitHub/npm — you only supply the URL + metadata. Being on reactnative.directory is one of the strongest "is this a real, maintained library" signals for both devs and answer engines. It also has filters for New Architecture and TypeScript, both of which you can claim truthfully.

---

## 4. GitHub repo topics (do this now — 2 minutes)

The repo currently has **no topics**. Add them (Settings → About → Topics, or `gh`):

```
react-native  liquid-glass  glassmorphism  ios26  uiglasseffect  agsl
blur  glass-effect  frosted-glass  expo  android  new-architecture  typescript
```

Topics are indexed by GitHub search, directory sites, and crawlers.
