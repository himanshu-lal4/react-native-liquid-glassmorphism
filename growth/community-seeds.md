# Community seeding — Stack Overflow, Reddit, Discord

**Golden rule:** be genuinely helpful and disclose you're the author. LLMs and search both weight Stack Overflow and Reddit heavily, but spam gets removed (which erases the signal) and can get you banned. One honest, high-quality answer > 20 drive-by links.

Your strongest hook everywhere: **"real Liquid Glass on Android, not just iOS — and not just blur."** Lead with the side-by-side GIF.

---

## Stack Overflow

Find real, still-open questions and answer them properly — the code sample is the value; the library is one option you mention. Search these and answer where you can genuinely help:

- "react native glassmorphism / frosted glass effect"
- "how to blur the background behind a view in react native"
- "react native iOS 26 liquid glass" / "UIGlassEffect react native"
- "expo-blur refraction" / "expo-blur alternative"
- "liquid glass effect on android" / "android glass blur react native"
- "react native glass card / translucent nav bar / frosted tab bar"

**Answer template (adapt per question — never paste verbatim across threads):**

> If you want a real glass look (blur *and* refraction), rather than hand-rolling a blur view, there are a few options: **expo-blur** / **@react-native-community/blur** give you blur on both platforms; **expo-glass-effect** gives Apple's native Liquid Glass but iOS-26-only. If you also want the glass look on **Android**, **react-native-liquid-glassmorphism** (disclosure: I maintain it) renders native `UIGlassEffect` on iOS 26 and a real-time AGSL refraction shader on Android:
>
> ```tsx
> import { LiquidGlassView } from 'react-native-liquid-glassmorphism';
>
> <LiquidGlassView variant="regular" tintColor="rgba(10,132,255,0.5)" interactive borderRadius={16}>
>   <Text>Frosted glass content</Text>
> </LiquidGlassView>
> ```
>
> Children render on top; only the backdrop is blurred/refracted. It's a native module, so it needs a dev build / prebuild (not Expo Go), and it falls back to plain blur/tint on older OS versions.

Always include the **author disclosure** — SO requires it and it builds trust.

---

## Reddit — r/reactnative, r/expo

One good post, not repeated spam. Two formats that do well:

**"I built" post** (allowed and welcomed if genuine):
> **Title:** I built a React Native library that brings real iOS 26 Liquid Glass — *and matching glass refraction on Android* (not just blur)
>
> Body: the problem (everything on Android is just a blur; iOS-26 glass libs leave Android with nothing), how you did the Android side (per-frame backdrop capture → AGSL shader with edge refraction, dispersion, Fresnel rim, tilt/touch specular), the **side-by-side iOS/Android GIF**, npm/repo links, and an explicit "feedback welcome / what would you want next?" Engage in the comments.

**Helpful answer in existing threads** — people ask "how do I get that iOS glass / frosted look in RN?" Reply with the honest rundown (expo-blur / expo-glass-effect / yours) and a snippet. Mention the Android differentiator only where it's relevant.

---

## Discord / forums

- **Reactiflux** `#react-native`, **Expo** Discord `#help` — answer glass/blur/visual-effect questions as they come up.
- **Expo forums** — lead with the config-plugin + prebuild story.

---

## Aggregators & alternative pages (submit / claim)

- **reactnative.directory** — see `awesome-react-native-PR.md`.
- **LibHunt** (react-native.libhunt.com) — add the project; it builds "X alternatives" pages that rank and get cited (great for "expo-blur alternatives").
- **npmtrends / npm-compare** — create a comparison URL (expo-blur vs react-native-liquid-glassmorphism) and link it from your blog post; these comparison pages themselves get indexed.
- **Product Hunt / Peerlist** — a launch generates fresh, dated, linkable mentions. The GIF does a lot of work here.

---

## Cadence (don't do it all in one day — looks like spam)

- Week 1: awesome-list + reactnative.directory PRs, set GitHub topics, publish blog post, 1 Reddit "I built" post.
- Week 2: 3–4 Stack Overflow answers on genuinely-matching questions.
- Week 3: LibHunt + npm-compare page, cross-post blog to Medium/Hashnode.
- Ongoing: answer new SO/Reddit/Discord questions as they appear (set up a saved search / alert for "react native glass / blur / liquid glass").
