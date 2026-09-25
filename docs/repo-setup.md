# Repository setup (GitHub)

The repository already exists at **github.com/nielsbrakel/SiteMark**. These steps
document how it was (or should be) configured, and how to recreate it from scratch.

## 1. Create the repository

**Web UI:** github.com → **New repository** → name `SiteMark` → public (needed for free
Actions minutes and store transparency) or private → add a README → **Create**.

**CLI** (`gh`):

```bash
gh repo create nielsbrakel/SiteMark --public --description "Mark production websites so you never confuse environments" --clone
cd SiteMark
```

## 2. Local development

```bash
corepack enable                 # activates the pinned pnpm from package.json
pnpm install                    # also runs `wxt prepare` (types in .wxt/)
pnpm dev                        # Chromium with the extension loaded + HMR
pnpm dev:firefox                # the same for Firefox
pnpm exec playwright install chromium   # once, for e2e tests
```

## 3. Repository settings

| Setting           | Value                                                                                                                                                           |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default branch    | `main`                                                                                                                                                          |
| Merge button      | Squash merge only, "Default to PR title". Auto-delete head branches                                                                                             |
| Ruleset `main`    | Require a PR, require status checks **check**, **build (chrome)**, **build (firefox)**, **build (safari)**, **e2e**. Require linear history. Block force pushes |
| Actions → General | Workflow permissions: read-only. Allow GitHub Actions to create PRs: off                                                                                        |
| Code security     | Dependabot alerts + security updates on. Secret scanning + push protection on                                                                                   |
| Topics            | `browser-extension`, `webextension`, `wxt`, `react`, `privacy`, `devtools`                                                                                      |

## 4. Labels

`type:feature`, `type:bug`, `type:chore`, `type:docs`, `area:core`, `area:marker`,
`area:picker`, `area:popup`, `area:options`, `browser:firefox`, `browser:safari`, `good first issue`.

## 5. Tracking

Progress is tracked **in the repo** (D-019):

- [`docs/tasks.md`](tasks.md): every task with 🔴/🟢/🔵 status, ticked in the same commit as the work.
- `pnpm progress`: progress bars per milestone plus a requirement → task → test traceability report.
  CI runs it with `--strict`, so a requirement without a task, or a task pointing to an
  unknown requirement, fails the build.
- One PR per milestone (or per few tasks), titled `M1: core domain (T-010…T-020)`. The PR template
  asks which tasks and REQs it covers.
- Tag pre-releases per milestone: `v0.1.0` = M1, … `v1.0.0` = M8.

Optional: a GitHub Projects board, if you want a Kanban view later (create issues from task rows).

## 6. Store publishing (M8)

Add these as **Actions secrets** only when releasing (used by `wxt submit` in `release.yml`):

| Store              | Secrets                                                                                       |
| ------------------ | --------------------------------------------------------------------------------------------- |
| Chrome Web Store   | `CHROME_EXTENSION_ID`, `CHROME_CLIENT_ID`, `CHROME_CLIENT_SECRET`, `CHROME_REFRESH_TOKEN`     |
| Firefox AMO        | `FIREFOX_EXTENSION_ID` (= `sitemark@nielsbrakel`), `FIREFOX_JWT_ISSUER`, `FIREFOX_JWT_SECRET` |
| Edge Add-ons       | `EDGE_PRODUCT_ID`, `EDGE_CLIENT_ID`, `EDGE_API_KEY`                                           |
| Safari (App Store) | Manual via Xcode + App Store Connect (Apple Developer Program membership)                     |
