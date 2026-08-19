# react-native-liquid-glassmorphism

Published to **two registries** — keep them in sync:

| Registry | Package name | How it publishes |
| --- | --- | --- |
| npm (primary) | `react-native-liquid-glassmorphism` | `.github/workflows/publish-npm.yml` (CI, with provenance) |
| GitHub Packages (mirror) | `@himanshu-lal4/react-native-liquid-glassmorphism` | `.github/workflows/publish-github-packages.yml` |

## Release checklist — IMPORTANT

**Both registries publish from CI, triggered by one GitHub Release.** Never run
`npm publish` (or `yarn release` with npm publishing re-enabled) locally: npm
provenance — the verified badge next to the version — can only be generated
from CI, and a local publish also consumes the version number the workflow
needs, so it cannot be re-published with provenance afterwards.

`main` requires a PR (0 approvals) and four checks — `lint`, `build-library`,
`build-android`, `build-ios` — and is strict, so the branch must be up to date.
That means the version bump has to land as a PR before the release is tagged.

```bash
# 1. bump the version on a branch (no tag — the release creates it)
git checkout -b release/vX.Y.Z
npm version X.Y.Z --no-git-tag-version
git commit -am "chore: release X.Y.Z"
gh pr create --title "chore: release X.Y.Z" --fill

# 2. merge it once CI is green (squash, as always)
gh pr merge --squash --delete-branch

# 3. tag the merged commit — this is what triggers both publishes
git checkout main && git pull
gh release create vX.Y.Z --generate-notes
```

Step 3 fires **both** `publish-npm.yml` (npm, with provenance) and
`publish-github-packages.yml` (the mirror).

Afterwards, verify:

- the new version on npmjs.com shows the **provenance** badge;
- the version appears under the repo's **Packages** section.

If a release was published but a workflow did not run, trigger it by hand:

```bash
gh workflow run publish-npm.yml -R himanshu-lal4/react-native-liquid-glassmorphism
gh workflow run publish-github-packages.yml -R himanshu-lal4/react-native-liquid-glassmorphism
```

**Smoke-testing auth without publishing:** dispatch `publish-npm.yml` manually
while `package.json`'s version is one already on npm. Auth runs first, so
`cannot publish over the previously published versions` means trusted
publishing works; an OIDC/token error means the npmjs.com registration does not
match the repo + workflow filename.

**Always remind the user about the GitHub Packages mirror when helping with a
release.**

The package name in `package.json` must stay `react-native-liquid-glassmorphism` — the workflow rewrites it to the repo-owner scope at publish time only (GitHub Packages requires scoped, owner-matching names).

The README's "Installing from GitHub Packages" section documents the mirror for users; keep it accurate if install steps or exports change.
