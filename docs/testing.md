# SiteMark — Testing & TDD workflow

> Decisions: D-209 (rebase-merge), D-210 (automated TDD enforcement), D-214 (manual Firefox), D-233 (test layers).
> Some tooling mentioned here arrives with the M0.5 hardening tasks. Those spots are marked _(T-xxx)_.

## Commands

| Command              | What it does                                                                                             |
| -------------------- | -------------------------------------------------------------------------------------------------------- |
| `pnpm test`          | Vitest projects `core` (node) + `dom` (happy-dom)                                                        |
| `pnpm test:browser`  | Vitest browser mode in Chromium (`*.browser.test.ts`)                                                    |
| `pnpm test:watch`    | Watch mode for the TDD loop                                                                              |
| `pnpm test:coverage` | All three projects with per-glob coverage thresholds (core 90/85, platform 85, overall 80)               |
| `pnpm test:e2e`      | Builds the e2e variant (`.output/chrome-mv3-e2e`) and runs Playwright                                    |
| `pnpm test:build`    | Builds all three targets, then manifest, output-scan and size assertions (`tests/build`)                 |
| `pnpm size`          | Chromium build + the gzip size budget only                                                               |
| `pnpm check`         | typecheck + lint (Biome) + format (Biome, Prettier for Markdown/YAML) + knip + unit tests + traceability |
| `pnpm progress`      | Progress per milestone + requirement coverage (`--verbose` lists gaps)                                   |

First-time Playwright setup: `pnpm exec playwright install chromium`, or set `PW_CHROMIUM_EXECUTABLE`
to an existing **Chromium / Chrome for Testing** (branded Chrome ≥ 137 ignores `--load-extension`).

## TDD protocol

Each task row in [tasks.md](tasks.md) is one or more red → green (→ refactor) rounds.

### 🔴 Red: `test(T-xxx): red — <behavior>`

1. Read the task's requirements in [spec.md](spec.md). Their acceptance criteria are your test cases.
2. Write the tests at the path in the _Tests_ column. The **top-level `describe` starts with the REQ ID**:

   ```ts
   describe('REQ-URL-001 wildcard matching', () => {
     it.each(table)('%s vs %s → %s', (pattern, url, expected) => { … });
   });
   ```

3. Add **typed stubs** so typecheck and lint still pass:

   ```ts
   export function matchPattern(pattern: WildcardPattern, url: string): boolean {
     return notImplemented(); // throws NotImplementedError (src/core/not-implemented.ts)
   }
   ```

4. Run the tests. They must fail **only** with assertion or `NotImplementedError` failures. Never use `it.fails`
   (it also passes on unrelated errors).
5. Commit only tests + stubs. The `verify-tdd` CI job _(T-020)_ checks that a red commit touches only
   `*.test.*`, `tests/**` and stub files, and that its tests really fail.

### 🟢 Green: `feat(T-xxx): green — <behavior>`

Write the simplest production code that passes. Run the whole suite. Commit. `verify-tdd` checks that
the tests from the red commit now pass and that red came first.

### 🔵 Refactor: `refactor(T-xxx): <what>` (optional)

Improve the code without changing behavior. `pnpm check` must pass. Don't make empty commits.

### Rules

- No production code without a failing test that needs it. Setup chores use `chore(T-xxx)`.
- One behavior per red. A task may take several red/green rounds.
- A bug fix starts with a reproducing test: `test(bug): red — …`, then `fix(bug): green — …`.
- A requirement counts as **covered** only when a **passing** test's title (or a Playwright `@REQ-…` tag)
  names it. Comments don't count _(T-019)_.
- Keep tests fast and deterministic: fake timers, fixed `IdGen`/`Clock`, no real network.
- PRs are **rebase-merged** (D-209), so red, green and refactor commits all stay on `main`.
  `git bisect run scripts/bisect.sh` skips `test(*): red` commits _(T-020)_.
- Commit messages are checked by commitlint (lefthook locally, and in CI) _(T-021)_. Hooks never run tests,
  so red commits are always committable.

## Test layers (D-233)

| Layer     | Where                          | Use it for                                                                                              |
| --------- | ------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `core`    | Vitest, node environment       | Pure domain logic. Table tests + fast-check properties                                                  |
| `dom`     | Vitest, happy-dom              | Use cases with in-memory fakes, adapters with the fake browser, DOM structure, React (RTL + vitest-axe) |
| `browser` | Vitest browser mode (Chromium) | Anything needing real layout, canvas, popover, `elementsFromPoint`, CSS cascade (`*.browser.test.ts`)   |
| e2e       | Playwright + built extension   | Real extension behavior: registration, permissions, isolated world, top layer, CSP, hostile pages       |
| build     | Vitest (node) on `.output/**`  | Manifest privacy assertions for every target, output scan for network/eval                              |
| mutation  | Stryker (nightly)              | `src/core` test strength                                                                                |
| manual    | This document                  | Firefox each release (D-214), Safari from v1.1                                                          |

**Fakes**: `tests/fakes/` provides stateful fakes for `permissions`, `scripting`, `i18n` (it reads
`en/messages.json` and throws on unknown keys) and `commands`, which `wxt/testing`'s fake browser lacks. They are
installed fresh before every `dom` test; drive them with `fakes()` (e.g. `fakes().permissions.answerNextRequest('deny')`).
Builders (`aSiteGroup()`, `aMark()`, `aState()`) always produce schema-valid data _(T-040)_.

**E2E specifics**:

- `wxt build --mode e2e` has its own outDir, pre-grants `prod.`/`test.sitemark.test`, uses an open shadow root and accepts `?tabId=`.
- Fixture site `tests/e2e/site/`: dashboard, SPA, lazy content, nested scroll, dialog, fullscreen, strict CSP +
  Trusted Types, a hostile page.
- A route in `tests/e2e/fixtures.ts` aborts every request that isn't `*.sitemark.test` and fails the test
  (`blockedRequests` lists them). Helpers arrive with their features: `dispatchCommand()` (T-074),
  `restartServiceWorker()` (T-076), `waitForMarker()` (T-078).
- Visual baselines (T-147) are generated and compared only inside the Playwright Docker image.

## Manual smoke checklist

**Firefox (each release):** `pnpm build:firefox` → `about:debugging` → _Load Temporary Add-on_ →
`.output/firefox-mv3/manifest.json`.

**Safari (from v1.1):** `pnpm build:safari`, then either upload the zip with the App Store Connect packager (TestFlight) or run
`xcrun safari-web-extension-converter .output/safari-mv3 --macos-only --copy-resources --app-name SiteMark --bundle-identifier dev.sitemark.SiteMark --no-open`.
For local unsigned runs: Safari → Settings → Developer → _Allow unsigned extensions_ (this resets when Safari quits).

| #   | Step                                                                                                           | Firefox | Safari |
| --- | -------------------------------------------------------------------------------------------------------------- | ------- | ------ |
| 1   | Install: no host-permission warning. The welcome tab opens                                                     | ☐       | ☐      |
| 2   | Popup on a new site → Mark this site → prompt → blue host ribbon appears                                       | ☐       | ☐      |
| 3   | Deny once → group shows "Not granted — Allow" → Allow works                                                    | ☐       | ☐      |
| 4   | Reload: the ribbon is still there with no prompt; restart the browser: still there                             | ☐       | ☐      |
| 5   | Pick element (button + shortcut) → save → the outline follows while scrolling                                  | ☐       | ☐      |
| 6   | During picking, clicking a page button does **nothing**                                                        | ☐       | ☐      |
| 7   | SPA navigation (pushState) updates marks; Hide survives it; a reload shows marks again                         | ☐       | ☐      |
| 8   | A page dialog / fullscreen video: the marks stay on top                                                        | ☐       | ☐      |
| 9   | A strict-CSP site: the marks render                                                                            | ☐       | ☐      |
| 10  | Options: edit color → the open tab updates live                                                                | ☐       | ☐      |
| 11  | Export → Reset → Import (merge) → one permission prompt → marks back                                           | ☐       | ☐      |
| 12  | Remove a group → revoke prompt → permission removed                                                            | ☐       | ☐      |
| 13  | Revoke the site in the browser's own settings → the popup shows "Not granted"                                  | ☐       | ☐      |
| 14  | OS dark mode + forced colors (Windows) → the popup, options and panel stay usable                              | ☐       | ☐      |
| 15  | Browser language Dutch → UI in Dutch, no overflow in the popup                                                 | ☐       | ☐      |
| 16  | Title prefix + favicon applied, then restored after hide/disable. Favicon "unavailable" on a CORS-favicon site | ☐       | ☐      |
