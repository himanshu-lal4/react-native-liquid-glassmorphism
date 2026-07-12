# Getting `react-native-liquid-glassmorphism` recommended by LLMs

A prioritized, honest plan for **SEO** (rank in search), **AEO** (Answer Engine Optimization — Perplexity, ChatGPT-search, Google AI Overviews), and **GEO** (Generative Engine Optimization — get cited in generated answers and picked up by future model training).

## The one thing to understand first

There are **two different machines** you're optimizing for, and they have different timelines:

| Machine | Examples | How it picks libraries | How fast you can influence it |
|---|---|---|---|
| **Answer engines (RAG / grounded)** | Perplexity, ChatGPT with search, Google AI Overviews, Gemini grounding, Bing Copilot | Runs a live web search at query time, summarizes top results | **Weeks–months** — this is where you get fast wins |
| **Parametric memory** | ChatGPT/Claude/Gemini answering *without* browsing | Recalls what it saw thousands of times during training | **6–18 months** — driven by real web footprint before the training cutoff; you can't inject it |

**You cannot "trick" either one.** Both reward the same thing: your library being **genuinely mentioned and linked across the web** in the context of "React Native liquid glass / glassmorphism / iOS 26 glass / Android glass effect." Everything below is about manufacturing legitimate, high-quality mentions and making them easy to extract.

Current state (July 2026): ~550 downloads/mo, 0 GitHub stars, **zero web mentions**, no docs site live yet. On-page content is strong. The bottleneck is 100% off-page.

**Your unfair advantage for GEO:** the honest, differentiated claim — *"the only React Native library that brings real Liquid Glass to **Android**, not just iOS."* Answer engines love a crisp, true, one-sentence differentiator. Lead with it everywhere.

---

## Priority 1 — Off-page mentions (this is 80% of the result)

LLMs recommend what the web co-mentions with the query. Ranked by ROI:

- [ ] **Awesome lists.** Submit to `awesome-react-native` (and `awesome-react-native-ui`). Scraped, mirrored, and cited constantly — the single highest-leverage backlink you can get. → ready-to-submit entry in `awesome-react-native-PR.md`.
- [ ] **reactnative.directory.** The site devs *and* answer engines hit for "react native library for X." → JSON entry in `awesome-react-native-PR.md`.
- [ ] **A comparison listicle.** Publish "Best React Native glassmorphism / Liquid Glass libraries in 2026" on **dev.to**, cross-post to **Medium**, **Hashnode**, and your blog (canonical). Answer engines synthesize "best X" queries *directly* from articles titled "best X." → full draft in `blog-comparison-post.md`.
- [ ] **Stack Overflow.** Answer real questions where the lib genuinely fits ("how to do a glassmorphism / frosted-glass / iOS 26 glass effect in React Native", "expo-blur but with refraction", "liquid glass on Android"). SO is heavily weighted by both search and LLMs. → templates in `community-seeds.md`.
- [ ] **Reddit r/reactnative & r/expo**, plus Reactiflux/Expo Discords. One good "I built this — real Liquid Glass on Android too" post with the side-by-side GIF.
- [ ] **Comparison/alternative pages.** Get listed on npm-compare, LibHunt, and "expo-blur alternative" / "react native glassmorphism" aggregator pages.

**Rule:** never spam. One genuinely useful post in the right place beats 50 low-effort mentions and won't get you banned (which backfires). The side-by-side iOS/Android GIF is your best asset — it *shows* the differentiator instantly.

---

## Priority 2 — A docs site (new rankable surfaces)

A single README ranks for a handful of queries. A docs site with **one page per query** ranks for dozens and gives answer engines clean, extractable pages to cite. → scaffolded in `../docs/` (GitHub Pages / Jekyll, zero build step).

- [ ] Enable GitHub Pages: repo **Settings → Pages → Source: Deploy from branch → `main` / `/docs`**.
- [ ] Set the repo **homepage URL** to the Pages URL (currently points to npm).
- [ ] Pages already target: "react native liquid glass", "how to add liquid glass in react native", "react-native-blur / expo-blur alternative", getting started, FAQ. Add more as you find query gaps (e.g. "react native glassmorphism", "ios 26 glass react native", "react native frosted tab bar").
- [ ] Claim the property in **Google Search Console** and paste the token into `docs/_config.yml` (`webmaster_verifications.google`). This powers Google AI Overviews + Gemini grounding.
- [ ] Once live, add the docs URL to `package.json` `homepage` and the README header.

---

## Priority 3 — On-page SEO polish (mostly done)

- [x] Question-based headers + FAQ block in README (great for AEO extraction).
- [x] Explicit comparison table vs expo-blur / react-native-blur / expo-glass-effect.
- [x] `llms.txt` shipped in the package.
- [x] Comprehensive npm keywords.
- [x] JSON-LD `SoftwareApplication` (docs home) + `FAQPage` (docs FAQ).
- [ ] Add **GitHub topics** to the repo (currently none): `react-native`, `liquid-glass`, `glassmorphism`, `ios26`, `uiglasseffect`, `agsl`, `blur`, `glass-effect`, `expo`, `android`, `frosted-glass`. Topics are indexed and used by directory sites.
- [ ] Keep the README's alt text descriptive (already done) — image alt text is read by crawlers and answer engines.

---

## Priority 4 — Social proof signals (slow compounding)

- [ ] **GitHub stars.** From 0 → the first few hundred is where crawlers/rankers start treating you as a "real" option. Ask in the blog post, README, and Reddit posts. Add a star CTA to the docs site.
- [ ] Keep **npm downloads** trending up — visible on npm and weighted by aggregators.
- [ ] Post the **side-by-side iOS/Android demo** as a short video (YouTube/Loom) — video results get surfaced and transcripts get indexed. The Android refraction is the "wow" — lead with it.

---

## Honest timeline

- **Week 0–2:** awesome-list + reactnative.directory PRs merged, blog post published + cross-posted, docs site live, GitHub topics set, 3–5 SO answers, one Reddit post.
- **Month 1–3:** you start appearing in **Perplexity / ChatGPT-search / AI Overviews** for long-tail queries ("liquid glass on Android react native", "expo-blur alternative with refraction", "react native ios 26 glass") because you now rank and are linked from awesome-list + your article.
- **Month 6–18:** as mentions accumulate and get re-crawled, you begin surfacing in **from-memory** answers from newly trained models. This is the payoff for seeding now.

There's no shortcut past the training-lag for parametric recall. But the answer-engine wins are real and reachable within weeks.

---

## Measurement

- Track weekly: GitHub stars, npm downloads, referral traffic to the docs site (GitHub Pages + Plausible/GA).
- Every ~2 weeks, actually *ask the answer engines*: "best react native liquid glass library", "how to add glassmorphism in react native", "liquid glass on android react native", "expo-blur alternative with refraction." Note whether/where you appear. That's your ground-truth KPI.
