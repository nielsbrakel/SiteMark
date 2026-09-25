# Repository setup (GitHub)

The repository is **github.com/nielsbrakel/SiteMark**. This page documents how it should be
configured and how to recreate it from scratch.

## 1. Create the repository

**Web UI:** github.com → **New repository** → `SiteMark` → public (for free Actions minutes
and store transparency) → **Create**.

**CLI:**

```bash
gh repo create nielsbrakel/SiteMark --public --description "Mark production websites so you never confuse environments" --clone
```

## 2. Local development

```bash
corepack enable                 # activates the pnpm version pinned in package.json
pnpm install                    # also runs `wxt prepare` (types in .wxt/)
pnpm dev                        # Chromium with the extension loaded + HMR
pnpm dev:firefox                # the same for Firefox
pnpm exec playwright install chromium   # once, for e2e / browser-mode tests
```

## 3. Repository settings

| Setting             | Value                                                                                                                               |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Default branch      | `main`                                                                                                                              |
| Merge button        | **Rebase merging only** (D-209). Squash and merge commits disabled. Auto-delete head branches                                       |
| Ruleset `main`      | Require a PR. Required status check **`ci-ok`** (the aggregate job, T-022). Require linear history. Block force pushes and deletion |
| Ruleset `v*` tags   | Only admins can create them (they trigger `release.yml`)                                                                            |
| Actions → General   | Workflow permissions: read-only. Allow GitHub Actions to create PRs: off. Require approval for first-time contributors              |
| Environment `store` | Required reviewer: repository owner. Deployment branches/tags: `v*` only. Holds the store secrets (section 6)                       |
| Code security       | Dependabot alerts + security updates on. Secret scanning + push protection on. Private vulnerability reporting on (SECURITY.md)     |
| Optional            | CodeQL (JavaScript/TypeScript) default setup; OpenSSF Scorecard action                                                              |
| Topics              | `browser-extension`, `webextension`, `wxt`, `react`, `privacy`, `devtools`                                                          |

## 4. Labels

`type:feature`, `type:bug`, `type:chore`, `type:docs`, `area:core`, `area:marker`,
`area:picker`, `area:popup`, `area:options`, `area:ci`, `browser:firefox`, `browser:safari`, `good first issue`.

## 5. Tracking and workflow

- [`docs/tasks.md`](tasks.md) is the task list. Each row is a TDD cycle linked to REQ IDs.
- `pnpm progress` shows progress per milestone and requirement → task → **passing test** traceability.
  CI runs it with `--strict`. After T-019, status is derived from git history.
- Commits: `test(T-xxx): red — …`, `feat(T-xxx): green — …`, `refactor(T-xxx): …`, `chore(T-xxx): …`,
  `docs: …`, `fix(bug): …`. Enforced by commitlint (T-021).
- One PR per task group, e.g. `M1: URL engine (T-032…T-039)`. User-facing PRs add a **changeset** (D-228).
- Pre-release tag per milestone: `v0.1.0` = M1 … `v1.0.0` = M8, `v1.1.0` = Safari (M9).
- The plan reviews live in [`docs/reviews/`](reviews/).

## 6. Store publishing (M8, D-227)

`release.yml` runs on protected `v*` tags. The **zip** job (no secrets) builds, asserts manifests, attests
provenance and writes SHA256SUMS. The **submit** job runs `wxt submit` inside environment `store`, which
waits for the owner's approval. Store secrets live **only** in that environment:

| Store            | Secrets                                                                                       |
| ---------------- | --------------------------------------------------------------------------------------------- |
| Chrome Web Store | `CHROME_EXTENSION_ID`, `CHROME_CLIENT_ID`, `CHROME_CLIENT_SECRET`, `CHROME_REFRESH_TOKEN`     |
| Firefox AMO      | `FIREFOX_EXTENSION_ID` (= `sitemark@nielsbrakel`), `FIREFOX_JWT_ISSUER`, `FIREFOX_JWT_SECRET` |
| Edge Add-ons     | `EDGE_PRODUCT_ID`, `EDGE_CLIENT_ID`, `EDGE_API_KEY`                                           |
| Safari (v1.1)    | App Store Connect packager / Xcode, with an Apple Developer Program membership (manual)       |

AMO also receives the WXT sources zip and `SOURCE_REVIEW.md` (exact Node/pnpm versions and build command).
