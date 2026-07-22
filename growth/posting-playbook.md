# Posting playbook — where, when & how to post (both libraries)

Companion to **`ready-to-post-content.md`** (the paste-ready copy). This doc is the *plan*: which platforms, how to submit to each (verified July 2026), the launch sequence, and the cross-linking rules. Two libraries:

- **react-native-liquid-glassmorphism** (v1.0.0) — visual/technical spectacle. Docs: https://himanshu-lal4.github.io/react-native-liquid-glassmorphism/
- **@wrack/react-native-tour-guide** (v1.0.1) — utility/ROI. Docs: https://himanshu-lal4.github.io/react-native-tour-guide/

---

## The one strategic call

**Lead the whole campaign with liquid-glass, then run tour-guide ~3–6 weeks later.**

Why: the "real Liquid Glass optics on Android via an AGSL refraction shader" angle is essentially *uncontested* — the only other RN library attempting it has ~13 stars and no formal release, and you shipped a real v1.0.0. That's a rare, defensible, visual, HN-worthy story. Launch it first (bigger splash → more eyes on your name), then convert that audience to tour-guide on the activation/Expo-Go angle.

**Don't co-launch the two.** Two unrelated libs in one post dilutes both and reads as content-farming. Cross-link them *passively* (an "also by me" line), never as a joint pitch.

---

## Make two core artifacts per library first, then slice everything from them

You do **not** write fresh content per channel. Per library, produce:

- **A — one deep-dive article** (canonical on your own docs site).
  - liquid-glass: the Android AGSL story — **already drafted** at `growth/blog-android-agsl-deep-dive.md`.
  - tour-guide: "auto shape-matching + smart auto-scroll internals" (needs writing).
- **B — one 15–45s vertical (9:16) demo video** + a looping GIF cut from it.
  - liquid-glass: a finger dragging glass over a colorful moving background; a split-screen iOS-native vs Android-shader.
  - tour-guide: a screen recording of the spotlight walking through a screen (round avatar → rounded card → off-screen button).

Then reshape the same A + B across every channel (thread = article's points + GIF as tweet 1; Short = the video; dev.to/Hashnode/Medium = syndicated article; README = the HN/PH landing surface).

---

## Where to post — verified submission methods (July 2026)

⚠️ = a gotcha that gets posts removed. **CHECK** = confirm on-site before posting (rules change / couldn't verify).

### Tier 1 — highest leverage

| Platform | How to post | Watch out for | Lib |
|---|---|---|---|
| **Own docs-site blog** | Publish the deep-dive here **first** as canonical | Wait 2–10 days before syndicating so Google indexes the original first | both |
| **dev.to** | Create Post → set `canonical_url` in front matter (max 4 tags, cover 1000×420) | Disclose author; syndicate *after* canonical is indexed | both |
| **Hacker News — Show HN** | news.ycombinator.com/submit, title `Show HN: …` | ⚠️ **Never solicit upvotes/comments (bannable).** No blog posts/landing pages — link the *repo*. No "best/first/fastest" in title. Post once, Tue–Thu ~9am–12pm ET, then reply fast for the first hour | **glass** (tour-guide variant is weaker) |
| **Reddit** | See per-sub notes below | ⚠️ **r/reactnative & r/androiddev effectively BAN self-promo.** Disclose authorship, frame as a value/"showoff" post, look for a weekly showcase thread, and read each sub's current rules first — or it gets removed. 90/10 rule; karma helps | both |
| **X/Twitter** | Post the thread | ⚠️ **Do NOT put the link in tweet 1** (~50% reach cut) — link in the first self-reply. GIF/video in tweet 1. 1–2 hashtags. Reply to early engagers in first 30 min | both |

### Tier 2 — strong reach

| Platform | How to post | Watch out for | Lib |
|---|---|---|---|
| **LinkedIn** | Personal post; native carousel/document performs best | Lead with value before the fold; 3–5 hashtags; test link in-post vs first comment | both |
| **YouTube Short / TikTok / Reels** | Upload the 9:16 demo | One clean master, no competitor watermark (downranked). Links: bio only (TikTok/Reels), description (YT). Anchor tag `#reactnative` | **glass** primarily |
| **Bluesky** | Post directly | ✅ Links NOT penalized — put the repo/npm link **in-post**. Get into dev custom feeds / starter packs | both |
| **Product Hunt** | Personal acct → Upcoming page → schedule launch (60-char tagline, 240×240 logo, 1270×760 gallery, prepped first comment) | ⚠️ **Never pay for traffic / don't directly ask for upvotes (ban).** Ship 12:01am PT, Tue–Thu; reply all day | **glass** |
| **Peerlist Launchpad** | Verified profile → project at 100% completion → Launch | ⚠️ Don't ask for upvotes. Weekly cycle, **launch Monday**, UTC | both |

### Tier 3 — directories, newsletters, aggregators

| Platform | How to post | Watch out for | Lib |
|---|---|---|---|
| **Hashnode** | Publish → "Add Original URL" (canonical) | Free public API retired May 2026 (manual cross-post) | both |
| **Medium — JavaScript in Plain English** | Author acct → submit via notify.cx/form/join-the-writing-team | ⚠️ **Better Programming is DEAD for submissions.** 1,000+ words, no affiliate links. ITNEXT/Stackademic = **CHECK** | both |
| **daily.dev** | "Suggest a Source" (RSS) or New Post | Needs **250+ reputation** to submit links; blogs excluded from sources | both |
| **LibHunt** (react-native.libhunt.com) | PR to the backing `awesome-react-native` list, or libhunt.com/site/project_submit | Meet the list's category/style rules | both |
| **Lobsters** | Submit with a tag | ⚠️ Invite-only; new users can't submit new domains for 70 days; self-promo <25% of activity | glass |
| **React Native Newsletter** | reactnativenewsletter.com/submit (form) | ✅ Self-submission fine; bi-weekly | both |
| **This Week in React** | Tag **@sebastienlorber** on X/Bluesky (no form) | Curated; Tuesdays | both |
| **Cooperpress** (React Status, JS Weekly, Node Weekly, Frontend Focus) | editor@cooperpress.com or reply to the email | Editorial (editor@) ≠ ads (sales@) | both |
| **Bytes / Pointer.io** | ⚠️ **Bytes = paid sponsorship only.** Pointer = **CHECK** (no confirmed free path) | — | — |

> **Note on SEO:** nearly every aggregator uses `nofollow`/`ugc` outbound links — they drive *referral traffic*, not link equity. Your own domain (via canonical) keeps the ranking value.

---

## Canonical cross-posting (protects your SEO)

1. Publish the article on your own docs site (canonical source of truth).
2. Wait 2–10 days for Google to index it.
3. Syndicate the **same** article — dev.to (`canonical_url`), Hashnode ("Add Original URL"), Medium (Import Story auto-sets `rel=canonical`), staggered a day apart.
4. Each copy carries a one-line "Originally published on [my blog]" backlink.
5. **Never** paste the same post twice on the *same* platform.

---

## Two-week launch wave (per library — never blast every channel the same day)

| Day | Action |
|---|---|
| 0 | Publish canonical article + demo video on your site. Polish the README: social-preview image + all GitHub topic tags (this is what ranked comparable projects #1 on Google). |
| 1 | X thread + GIF; post the Short/Reel/TikTok. |
| 2 | Reddit (value-first "showoff", author disclosed) — r/reactnative + r/androiddev for glass; r/reactnative + r/expo for tour-guide. Read each sub's rules first. |
| 3 | Show HN (glass) / dev.to "I built" story (tour-guide), morning ET. |
| 5–7 | Peerlist (Mon) then Product Hunt (glass, Tue–Thu). |
| 8–12 | Syndicate the article → dev.to → Hashnode → Medium (staggered, canonical set). |
| Ongoing | Set up **F5Bot** on keywords ("react native glassmorphism", "expo onboarding tour", "coach marks react native", "liquid glass react native") and reply helpfully when people ask. This is the sustainable long-tail. |

Sequencing: run the **full glass wave first**, start the **tour-guide wave ~3–6 weeks later**. Between waves keep a light build-in-public trickle on X so the account stays warm.

---

## Cross-linking rules (how to promote both without looking spammy)

- **Passive "also by me" footer** at the bottom of each post/README — the paste-ready copy already does this. Never an active cross-sell.
- **Mention the sibling only when contextually earned** (e.g. a glass onboarding-screen demo can naturally note "the coach-mark overlay is my other lib, tour-guide").
- **Build a single author page** (himanshu-lal4.github.io root) listing both — "same author, two quality libs" reads as credibility, not spam.
- **Legit bundling:** one "how I built a polished onboarding flow" tutorial can *use both* (glass cards + spotlight tour). That's a value post that happens to feature both.
- Disclose authorship on every Reddit / HN / Stack Overflow post.

---

## The paste-ready copy lives in `ready-to-post-content.md`

Every post referenced above is written out there, per platform × per library, with links already filled in. Review, attach your GIF/video where noted, and post.
