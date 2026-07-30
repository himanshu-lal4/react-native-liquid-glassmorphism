# react-native-liquid-glassmorphism

Published to **two registries** — keep them in sync:

| Registry | Package name | How it publishes |
| --- | --- | --- |
| npm (primary) | `react-native-liquid-glassmorphism` | manual `npm publish` |
| GitHub Packages (mirror) | `@himanshu-lal4/react-native-liquid-glassmorphism` | `.github/workflows/publish-github-packages.yml` |

## Release checklist — IMPORTANT

After any version bump / npm publish, the GitHub Packages mirror must be updated too:

- The workflow runs **automatically** when a GitHub Release is published. Prefer creating a GitHub Release for each version (`gh release create vX.Y.Z`).
- If no release was created, trigger it manually: `gh workflow run publish-github-packages.yml -R himanshu-lal4/react-native-liquid-glassmorphism`
- **Always remind the user about the GitHub Packages mirror when helping with a release.** Verify afterwards that the new version appears under the repo's Packages section.

The package name in `package.json` must stay `react-native-liquid-glassmorphism` — the workflow rewrites it to the repo-owner scope at publish time only (GitHub Packages requires scoped, owner-matching names).

The README's "Installing from GitHub Packages" section documents the mirror for users; keep it accurate if install steps or exports change.
