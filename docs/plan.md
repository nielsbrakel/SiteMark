# SiteMark — Technical plan

> Implements [spec.md](spec.md) (rev 2). Work items live in [tasks.md](tasks.md), and the process in
> [testing.md](testing.md). Decisions are referenced as D-xxx ([decisions.md](decisions.md)).

## 1. Stack

| Concern         | Choice                                                                                                                           | Ref                |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| Build / dev     | WXT 0.21 (Vite 8), MV3 everywhere, **auto-imports off**                                                                          | D-003, D-222       |
| UI              | React 19 + TypeScript (popup, options, grant page), with CSS Modules                                                             | D-236              |
| Content scripts | Plain TypeScript + DOM, shadow-root CSS through adopted sheets or `<style>`                                                      | D-101, D-232       |
| Validation      | zod 4, strict schemas, `jitless`                                                                                                 | D-102, D-238       |
| Storage         | Plain `storage.local`. One writer (background). One migration pipeline                                                           | D-220, D-224       |
| Messaging       | `@webext-core/messaging` with sender validation + zod payloads                                                                   | D-104, REQ-SEC-003 |
| Selectors       | `@medv/finder` + SiteMark token filters                                                                                          | D-105              |
| Regex safety    | `@eslint-community/regexpp` (parse + safe-subset check)                                                                          | D-211              |
| Tests           | Vitest 4 (projects: node / happy-dom / browser mode), RTL, fast-check, Stryker, Playwright                                       | D-233              |
| Quality         | TS strict+, Biome 2 (lint + format, zones, GritQL plugins), Prettier (Markdown/YAML only), stylelint, knip, commitlint, lefthook | D-234–D-237, D-243 |
| Release         | Changesets, `wxt zip` / `wxt submit` behind the `store` environment                                                              | D-227, D-228       |
| Package manager | pnpm 10 (policies in `pnpm-workspace.yaml`), Node 22                                                                             | D-238              |

A library is added by the task that first needs it, never ahead of time.

## 2. Source layout and layering (D-222)

```text
src/
├─ core/            PURE domain. No browser APIs, no DOM (lib: ES2023). Tested in node.
│  ├─ result.ts          Result<T,E>, error codes, assertNever
│  ├─ ids.ts             branded IDs, IdGen interface
│  ├─ url/               parse.ts · glob.ts (linear matcher) · origin.ts · broad.ts · regex-safety.ts · match.ts
│  ├─ model/             schema.ts (zod) · defaults.ts · color.ts · presets.ts
│  ├─ commands/          command types · reducers (groups, patterns, marks) · apply-command.ts
│  ├─ render/            compose.ts → RenderPlan · diff-plan.ts
│  ├─ data/              migrate.ts · export.ts · import.ts (parse, preview, merge)
│  ├─ selector-tokens.ts isStableToken, escaping (pure string logic)
│  ├─ picker-machine.ts  transition(state, event)
│  └─ restricted.ts      restricted-URL hint list
├─ app/             Use cases + PORTS (interfaces). Depends only on core.
│  ├─ ports.ts           StateRepo, Permissions, ScriptRegistrar, Tabs, Badge, Clock, IdGen, Logger
│  ├─ command-queue.ts   serialized single writer (D-220)
│  └─ use-cases/         markThisSite · savePick · grantOrigins · importData · syncRegistration · renderPlanFor · reportStatus
├─ platform/        ADAPTERS implementing the ports with browser.* (Chrome/Firefox/Safari quirks live here)
│  ├─ state-repo.ts · permissions.ts · registration.ts · tabs.ts · badge.ts · commands.ts
│  ├─ browser-info.ts    feature flags (hasNavigationApi, hasPopover, canAdoptSheetsInContent…)
│  └─ messaging.ts       protocol + sender validation
├─ shared/
│  └─ marker-view/  DOM builders + CSS for each effect (used by the content renderer AND the options preview)
├─ content/         Runs in web pages (no React)
│  ├─ marker/            host.ts · renderer.ts (EffectViews, Disposer) · tracker.ts · url-watch.ts · document-effects.ts
│  └─ picker/            glass-pane.ts · selector.ts (generateSelector, DOM) · panel.ts
├─ ui/              React, shared by popup + options: components/ · hooks/ · mount.tsx
├─ lib/i18n.ts      t(), tp() (plurals), typed MessageKey
├─ styles/          tokens.css · base.css
└─ entrypoints/     COMPOSITION ROOTS only: background.ts · content.ts · picker.ts · popup/ · options/ · grant/
```

**Dependency rule:** `core ← app ← platform | shared | content | ui ← entrypoints`. `content` and
`ui` never import each other; both use `shared`. This is enforced by Biome `noRestrictedImports` zones
(per-layer `overrides`, D-243), a DOM-free `src/core/tsconfig.json`, and running core tests in `environment: 'node'` (T-011–T-013).

## 3. Runtime architecture

```text
                        ┌──────────── storage.local ────────────┐
                        │ sitemark:state (v1, revision)          │
                        │ sitemark:backup:{0..2}                 │  access level: TRUSTED_CONTEXTS
                        └────────────────▲───────────────────────┘
                                         │ ONLY writer (D-220)
┌─────────────────────┐  intents   ┌─────┴──────────────────────────┐  commands   ┌─────────────────┐
│ content.ts (marker) │──────────▶ │ background                      │ ◀────────── │ popup / options │
│ per granted origin  │ ◀───────── │ • command queue → applyCommand  │ ──────────▶ │ (watch state,   │
│ renders RenderPlan  │ renderPlan │ • renderPlanFor(url) (need-to-  │  state push │  read-only)     │
│ reports status      │            │   know, D-221)                  │             │ permissions.req │
└─────────────────────┘            │ • syncRegistration (D-231)      │             │ (user gesture)  │
┌─────────────────────┐  savePick  │ • commands, badge, deep links   │             └─────────────────┘
│ picker.ts on demand │──────────▶ │ • sender validation (SEC-003)   │
└─────────────────────┘            └─────────────────────────────────┘
```

### 3.1 MV3 background rules

- Register **all listeners synchronously at the top level** of `defineBackground`.
- Keep **no in-memory state that must survive**. Anything durable goes into `storage.local`.
- `syncRegistration()` runs on every start (the service worker or Firefox event page may be killed at any time).
- The command queue is a promise chain. Each command does: read the fresh state → `applyCommand` (pure) → validate → write with `revision + 1` → push the new render plans to affected tabs.

### 3.2 Permission & registration flow (D-229, D-231)

1. A user gesture in an extension page (Add pattern, Mark this site, Allow, import). It calls
   `permissions.request({ origins })` **first and synchronously**, then sends the command without awaiting it.
2. If the context can't prompt reliably (the popup may close; the in-page panel isn't allowed to), open
   `grant.html?origins=…` in a tab instead. The background derives origins from `sender.tab` for panel requests.
3. The background handles `permissions.onAdded/onRemoved`, `runtime.onInstalled/onStartup`, every
   background start, and state changes by calling `syncRegistration()`:
   - desired = granted origins ∩ origins of enabled groups (computed in core)
   - single-flight: if a sync is already running, set a "dirty" flag and run once more afterwards
   - diff against `scripting.getRegisteredContentScripts()` → `register`/`update`/`unregister` for id `sitemark-marker`
     (`runAt: document_start`, `allFrames: false`, `persistAcrossSessions: true`, `world: ISOLATED`).
4. Newly granted origins → `executeScript` into open matching tabs. REQ-RND-012 makes a second injection safe.
5. Grant state is always read live (`permissions.contains`), because Safari users can change it in Safari's own UI.

### 3.3 Marker content script (REQ-RND-*)

```text
start → singleton guard (isolated-world symbol; the old instance is disposed)
      → ask the background for renderPlanFor(location.href)
         ├─ empty → idle: URL watch only (no DOM, no observers)            REQ-RND-009
         └─ plan  → host (closure ref, shadow mode flag, popover top layer)
                    → diffPlan(prev, next) → { add, update, remove }       keyed by `${markId}:${effect}`
                    → EffectView { mount, update, dispose } per key, each wrapped in try/catch
                    → Disposer collects listeners/observers per view
on: render plan push · URL change · hide toggle · top-layer change · orphan check (runtime.id gone → dispose all)
```

- **Host:** `<sitemark-root popover="manual">` on `documentElement`, with `:host { all: initial !important;
position: fixed !important; inset: 0 !important; pointer-events: none !important; … }`, and
  `::backdrop { display: none !important }`. It is re-attached or re-promoted (rate-limited) when removed or when the top layer changes.
- **Styles:** `adoptedStyleSheets` where it works in content scripts, `<style>` otherwise (D-232).
- **Tracker:** one rAF loop driven by dirty flags. Capture-phase passive scroll listeners, one `ResizeObserver`,
  positioning with `transform: translate()` in viewport coordinates.
- **URL watch:** poll `location.href` every 500 ms (first-class), plus `popstate`/`hashchange`, plus the Navigation API
  `navigatesuccess` where available.
- **DocumentEffects:** the single owner of title-prefix and favicon state (apply/strip, restore).

### 3.4 Picker (REQ-PICK-*, D-240)

`type PickerState = idle | picking{candidate, mode: 'pointer'|'keyboard'} | editing{selection} | done`,
changed only by a pure `transition(state, event)` in core. Invoking the picker again while it's active cancels it.
The **glass pane** is a separate top-layer host with `pointer-events:auto` that uses `elementsFromPoint` and captures
focus. The panel sends a `savePick` intent; the background validates it and decides which group it goes to
(an active group for `sender.url`, or a new group for `sender.origin`).

## 4. Message protocol (`platform/messaging.ts`)

```ts
// extension pages → background (sender must be an extension page)
command(cmd: Command): Result<{ revision: number }>;
getState(): SiteMarkState;                 // read-only view for popup/options
startPicker(d: { tabId: number; repickMarkId?: MarkId }): void;
toggleHidden(d: { tabId: number }): void;
getTabStatus(d: { tabId: number }): TabStatus | 'not-injected' | 'restricted';
// content script → background (sender must be a top-frame content script; origin taken from sender)
renderPlanFor(): RenderPlan;
reportStatus(s: MarkStatus[]): void;
savePick(d: { selector: string; siteGroupId?: SiteGroupId; effects: ElementEffectKind[]; color: Hex }): Result<MarkId>;
requestGrant(): void;                      // opens grant.html for sender origin
openOptions(d: { route: string }): void;
// background → content (tabs.sendMessage)
applyPlan(p: RenderPlan): void;
setHidden(d: { hidden: boolean }): void;
```

An exhaustiveness test checks that every protocol key has a handler and a zod schema (T-065).

## 5. Test strategy (D-233)

| Layer             | Tool                                  | Scope                                                                                          | Files                   |
| ----------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------- |
| Unit              | Vitest `core` project (node)          | `src/core/**`, table-driven + fast-check properties                                            | `*.test.ts`             |
| Integration       | Vitest `dom` project (happy-dom)      | `app` use cases with in-memory fakes; `platform` adapters with the fake browser; DOM structure | `*.test.ts`             |
| Component         | Vitest `dom` + RTL + vitest-axe       | React components/pages, queried by role and label                                              | `*.test.tsx`            |
| Browser           | Vitest `browser` project (Chromium)   | Layout, tracker, popover, canvas favicon, selector generation, picker input                    | `*.browser.test.ts`     |
| E2E               | Playwright + built Chromium extension | Real flows on fixture sites, hostile pages, strict CSP                                         | `tests/e2e/*.spec.ts`   |
| Manifest/artifact | Vitest (node) on `.output/*`          | Privacy manifest assertions for all targets, built-output network scan                         | `tests/build/*.test.ts` |
| Mutation          | Stryker (nightly)                     | `src/core`                                                                                     | —                       |
| Manual            | Checklist                             | Firefox per release (D-214), Safari from v1.1                                                  | `docs/testing.md`       |

**E2E specifics:**

- `wxt build --mode e2e` writes to its own outDir and pre-grants only `*://prod.sitemark.test/*` and
  `*://test.sitemark.test/*` (`new.sitemark.test` stays ungranted, to cover the not-granted states).
- `__SHADOW_MODE__ = 'open'` in e2e and test builds (D-226).
- `--host-resolver-rules=MAP *.sitemark.test 127.0.0.1` together with a Playwright `webServer` serving `tests/e2e/site/`.
- Helpers: `restartServiceWorker()`, `dispatchCommand(name)` (an e2e-only background hook), `waitForMarker()`,
  and a network listener that fails the test on any request that isn't `*.sitemark.test`.
- The popup is tested as `popup.html?tabId=` (honored **only** in e2e builds).
- Visual baselines are generated and compared only inside the Playwright Docker image.

## 6. CI/CD

| Workflow      | Trigger            | Jobs                                                                                                                                                                                                                                                                                                                                 |
| ------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ci.yml`      | PR, push `main`    | **check** (typecheck, lint, stylelint, format, knip, unit + dom + coverage) · **unit-browser** · **build** matrix chrome/firefox/safari (+ manifest tests, output scan, size budget, `web-ext lint`) · **e2e** (Playwright container) · **verify-tdd** (PRs) · **commitlint** (PRs) · **ci-ok** (aggregate; the only required check) |
| `nightly.yml` | cron               | Stryker (core), perf probes (reported only)                                                                                                                                                                                                                                                                                          |
| `release.yml` | protected `v*` tag | Zip job (no secrets) → attest provenance + SHA256SUMS + manifest assertions → **submit** job in environment `store` (required reviewer) running `wxt submit` for Chrome/Edge/Firefox                                                                                                                                                 |

All actions are pinned by SHA, use `persist-credentials: false`, set `timeout-minutes`, and have job-level permissions (D-238).

## 7. Milestones

| #    | Milestone           | Outcome                                                                                                                              |
| ---- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| M0   | **Foundation** ✅   | Spec, plan, design, logo, scaffold, CI, smoke tests                                                                                  |
| M0.5 | **Hardening**       | Guardrails before code: TS/lint/zones, test projects + fakes, e2e mode, CI/supply chain, progress v2, verify-tdd, hooks, conventions |
| M1   | **Core domain**     | URL engine, schema, commands/reducers, compose/diff, data pipeline, picker machine                                                   |
| M2   | **App & platform**  | Ports, command queue, messaging, permissions, registration, badge, use cases                                                         |
| M3   | **Marker renderer** | Host, effects, tracker, SPA, hide, top layer, hostile-page resilience                                                                |
| M4   | **Picker**          | Glass pane, selector generation, panel, re-pick, shortcuts                                                                           |
| M5   | **Popup**           | Status, mark this site, permission, hide, restricted, badge UI                                                                       |
| M6   | **Options**         | Groups, patterns, marks, preview, settings, data, welcome, diagnostics                                                               |
| M7   | **Polish**          | i18n review, axe, zoom, visual baselines, perf, Firefox smoke                                                                        |
| M8   | **Release v1.0**    | PRIVACY, SECURITY, store assets, release workflow, submission (Chrome/Edge/Firefox)                                                  |
| M9   | **Safari v1.1**     | Safari 18 build, packaging, fixes, App Store                                                                                         |

Each milestone ends with: all its tasks done (status derived from git), `pnpm check` + e2e green,
every Must REQ of the milestone covered by a passing test, and a pre-release tag (`v0.<M>.0`).

## 8. Browser compatibility notes (from the platform review)

| Concern                                 | Chrome ≥ 120 | Firefox ≥ 140                           | Safari ≥ 18 (v1.1)                          |
| --------------------------------------- | ------------ | --------------------------------------- | ------------------------------------------- |
| Runtime `permissions.request`           | ✅           | ⚠️ must be synchronous; popup may close | ⚠️ Safari's own per-site UI, one-day grants |
| `registerContentScripts` persistence    | ✅           | ✅                                      | ⚠️ unreliable → re-sync on start            |
| `adoptedStyleSheets` in content scripts | ✅           | ❌ until bug 1751346 ships → `<style>`  | ✅                                          |
| Popover top layer                       | ✅           | ✅                                      | ✅                                          |
| Navigation API in the isolated world    | ✅           | ❌ → polling                            | ❌ → polling                                |
| `onCommand.tab`                         | ✅           | ✅                                      | ✅ (18+)                                    |
| Dynamic favicon                         | ✅           | ✅                                      | ⚠️ best-effort                              |
| E2E automation                          | Playwright   | manual (D-214)                          | manual                                      |

## 9. Risks

| Risk                                          | Mitigation                                                                                                                       |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| The popup dies during a permission prompt     | Request first, background completes on `onAdded`, grant page fallback (D-229)                                                    |
| Safari grant/registration behavior differs    | Live `permissions.contains`, re-sync on every start, M9 dedicated milestone                                                      |
| Generated selectors break after deploys       | Stable-attribute preference, editable selector, "not found" + badge + Re-pick                                                    |
| Page top layer / fullscreen covers marks      | Re-promotion (D-215) + e2e with dialog and fullscreen                                                                            |
| Hostile or strict-CSP pages break marks       | REQ-SEC-006/007, hostile-page and CSP e2e fixtures                                                                               |
| ReDoS                                         | Safe-subset regex, linear glob, caps (D-211, REQ-URL-010)                                                                        |
| TDD discipline erodes under deadline pressure | verify-tdd CI job, git-derived status (D-210)                                                                                    |
| Toolchain majors (Biome 3, Vitest 5, TS 7)    | Dependabot ignores majors until WXT supports them. Biome is pinned exactly and bumped in its own PR with `biome migrate` (T-023) |
