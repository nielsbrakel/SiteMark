# SiteMark — Technical plan

> Implements [spec.md](spec.md). Work items live in [tasks.md](tasks.md).
> Process: [testing.md](testing.md) (TDD red → green → refactor).

## 1. Stack

| Concern         | Choice                                                                    | Ref          |
| --------------- | ------------------------------------------------------------------------- | ------------ |
| Build / dev     | WXT 0.21 (Vite 8), MV3 everywhere                                         | D-003, D-004 |
| UI              | React 19 + TypeScript (popup, options, grant page)                        |              |
| Content scripts | Plain TypeScript + DOM, CSS imported as strings into a shadow root        | D-101        |
| Validation      | zod                                                                       | D-102        |
| Storage         | `wxt/utils/storage` `defineItem` with version + migrations, `local:` only | D-103, D-009 |
| Messaging       | `@webext-core/messaging` (typed protocol)                                 | D-104        |
| Selectors       | `@medv/finder` + SiteMark filters                                         | D-105        |
| Tests           | Vitest 4 + happy-dom + RTL, `wxt/testing` fake browser, Playwright        | D-020        |
| Quality         | TypeScript strict, ESLint 9 (typescript-eslint, react-hooks), Prettier    |              |
| Package manager | pnpm 10, Node 22                                                          | D-021        |

Libraries are added by the task that first needs them (never speculatively).

## 2. Source layout

```text
src/
├─ core/                 # PURE TypeScript: no browser.* calls. Highest test density.
│  ├─ schema.ts          # zod schemas + inferred types (spec §7)
│  ├─ defaults.ts        # default state, default mark, color presets
│  ├─ migrations.ts      # vN → vN+1 functions
│  ├─ url-pattern.ts     # parse, validate, compile, match, toOriginPattern
│  ├─ matching.ts        # matchProfiles(url, profiles) → ordered matches
│  ├─ color.ts           # contrast ratio, autoTextColor
│  ├─ selector.ts        # generateSelector(el), isStableToken(), countMatches()
│  ├─ compose.ts         # merge page effects of all matching profiles (stacking rules)
│  ├─ import-export.ts   # buildExport(), parseImport(), mergeStates()
│  └─ ids.ts             # id generator (injectable for tests)
├─ platform/             # Thin, mockable wrappers over browser APIs
│  ├─ store.ts           # state item, load/save/watch, corrupt-data backup
│  ├─ permissions.ts     # has/request/remove origins, diff helpers
│  ├─ registration.ts    # sync registered content scripts ↔ granted origins
│  ├─ tabs.ts            # current tab, restricted-URL detection
│  └─ messaging.ts       # protocol definition (see §5)
├─ content/              # Runs in web pages (no React)
│  ├─ marker/
│  │  ├─ host.ts         # <sitemark-root>, closed shadow root, popover top layer
│  │  ├─ page-effects.ts # banner, frame, ribbon, stripes, watermark, tint
│  │  ├─ document-effects.ts # title prefix + favicon (reversible)
│  │  ├─ element-effects.ts  # overlay per element mark
│  │  ├─ tracker.ts      # rect tracking: scroll/resize/RO/MO, rAF batching
│  │  ├─ url-watch.ts    # SPA URL change detection
│  │  └─ marker.css      # all mark styles (inside shadow root)
│  └─ picker/
│     ├─ picker.ts       # hover/keyboard/select state machine
│     ├─ panel.ts        # post-pick mini panel (shadow DOM)
│     └─ picker.css
├─ ui/                   # React, shared by popup + options
│  ├─ components/        # Button, Switch, Card, Field, ColorField, Segmented, Slider, Dialog, Toast
│  ├─ hooks/             # useSiteMarkState, useCurrentTab, useTheme
│  └─ preview/           # MarkPreview (reuses content/marker CSS for fidelity)
├─ lib/i18n.ts
├─ styles/               # tokens.css, base.css
└─ entrypoints/
   ├─ background.ts      # wiring only: messages, commands, registration sync, hide state
   ├─ content.ts         # runtime-registered marker script → content/marker
   ├─ picker.ts          # unlisted script injected on demand → content/picker
   ├─ popup/             # React
   ├─ options/           # React
   └─ grant/             # React: permission fallback page (D-106)
```

**Dependency rule:** `core` ← `platform` ← (`content`, `ui`) ← `entrypoints`. `core` never
imports from the others. An ESLint `no-restricted-imports` rule enforces this (task T-003).

## 3. Runtime architecture

```text
             ┌──────────────── storage.local ────────────────┐
             │  sitemark:state (v1)   sitemark:backup (corrupt) │
             └───────▲──────────────▲──────────────▲──────────┘
                     │ read/watch   │ read/write   │ read/write
┌────────────────────┴──┐   ┌───────┴──────┐   ┌───┴─────────────┐
│ content.ts (marker)   │   │  background   │   │ popup / options │
│ registered per granted│◀──│  - registration sync               │
│ origin; renders marks │msg│  - commands (start-picker)         │
│ reports mark status   │──▶│  - per-tab hidden state (session)  │
└───────────────────────┘   │  - inject picker (activeTab)  │◀──│ user gestures:  │
┌───────────────────────┐   └──────────────┘   │ permissions.request│
│ picker.ts (on demand) │── save mark ─────────────────────────▶ storage
└───────────────────────┘
```

### 3.1 Permission & registration flow (REQ-PRIV-001..004)

1. The user saves a pattern → the UI computes `toOriginPattern()` → calls
   `permissions.request({ origins })` **inside the click handler** (user gesture).
2. Firefox may close the popup while the prompt is open. The popup therefore
   checks `import.meta.env.FIREFOX`: on Firefox it opens `grant.html?origins=…`
   in a tab and requests from there (D-106).
3. The background listens to `permissions.onAdded/onRemoved`, `runtime.onInstalled`,
   `runtime.onStartup` and state changes → `syncRegistration()`:
   - desired = granted origins ∩ origins used by enabled profiles
   - `scripting.getRegisteredContentScripts` → `update`/`register`/`unregister` the single
     script id `sitemark-marker` with `matches = desired`, `runAt: document_start`,
     `allFrames: false`, `persistAcrossSessions: true`.
4. Newly granted origins also get `scripting.executeScript` into already open matching
   tabs, so the user doesn't need to reload.

### 3.2 Background responsibilities

The background has no business logic. Everything calls `core`/`platform`.

| Handler                | Does                                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `commands.onCommand`   | `start-picker` → inject `picker.js` into the active tab                                                                         |
| message `startPicker`  | same, from the popup (optionally `{ repickMarkId }`)                                                                            |
| message `getTabStatus` | relays to the tab's content script → `{ matches, markStatus[] }`                                                                |
| message `setHidden`    | stores `hidden[tabId]` in `storage.session` and notifies the tab. Cleared on `tabs.onUpdated` (URL change) and `tabs.onRemoved` |
| registration sync      | §3.1                                                                                                                            |

### 3.3 Marker content script (REQ-RND-*)

```text
start → load state → matchProfiles(location.href)
  ├─ none → idle (only watch storage + URL; no DOM)             REQ-RND-009
  └─ some → compose(effects) → ensureHost() → render
             ├─ page effects → static nodes in shadow root
             ├─ document effects → title observer, favicon swap (reversible)
             └─ element marks → resolve selector
                    ├─ found   → overlay + tracker
                    └─ missing → MutationObserver (debounced 200 ms) → retry
on storage change / URL change / hidden toggle → diff & re-render
```

- **Host:** `<sitemark-root popover="manual">` appended to `document.documentElement`,
  `attachShadow({ mode: 'closed' })`, `:host { all: initial; position: fixed; inset: 0;
pointer-events: none; }`. It is re-appended if a framework removes it.
- **Tracker:** one shared rAF loop, driven only by dirty flags (scroll listeners are `capture: true,
passive: true`), with one `ResizeObserver` for all targets. Overlays are positioned with
  `transform: translate()` in viewport coordinates.
- **SPA:** `navigation.addEventListener('navigate')` where available, plus `popstate`/`hashchange`,
  plus a 500 ms `location.href` check as a fallback (content scripts can't see page `pushState`).

### 3.4 Picker (REQ-PICK-*)

A state machine: `idle → hovering ⇄ keyboardNav → selected → panel → saved | cancelled`.
It is injected per use, removes all listeners on exit, and its UI lives in its own
shadow host. The panel writes to storage through `platform/store`, and the content script
picks the change up (REQ-RND-007).

## 4. Composition rules (REQ-PROF-005)

`compose(matches)` reduces all marks of all matching profiles, in priority order, into
a render plan:

| Effect                          | Rule                                                                        |
| ------------------------------- | --------------------------------------------------------------------------- |
| banner                          | stack all: top banners top-down in priority order, bottom banners bottom-up |
| frame                           | nest: highest priority outermost                                            |
| page ribbon                     | one per corner; the highest priority wins that corner                       |
| watermark / page tint / stripes | all rendered, layered by priority                                           |
| title prefix / favicon          | highest priority only                                                       |
| element marks                   | all rendered independently                                                  |

## 5. Message protocol (`platform/messaging.ts`)

```ts
interface ProtocolMap {
  startPicker(data: { tabId: number; repickMarkId?: string }): void;
  getTabStatus(data: { tabId: number }): TabStatus | null;
  setHidden(data: { tabId: number; hidden: boolean }): void;
  // background → content
  contentStatus(): TabStatus;
  contentSetHidden(data: { hidden: boolean }): void;
}
interface TabStatus {
  url: string;
  profileIds: string[];
  marks: { markId: string; state: 'found' | 'missing' | 'hidden' }[];
}
```

## 6. Test strategy

| Layer       | Tool                                  | Scope                                                                   | Location                       |
| ----------- | ------------------------------------- | ----------------------------------------------------------------------- | ------------------------------ |
| Unit        | Vitest (node/happy-dom)               | `src/core/**`: table-driven, one `describe('REQ-…')` per requirement    | `src/**/x.test.ts` (colocated) |
| Integration | Vitest + `fakeBrowser`                | `src/platform/**`, background handlers, marker/picker in happy-dom      | colocated                      |
| Component   | Vitest + React Testing Library        | popup/options/ui components, i18n + a11y roles                          | colocated `*.test.tsx`         |
| E2E         | Playwright + built Chromium extension | real flows on fixture sites `prod.sitemark.test` / `test.sitemark.test` | `tests/e2e/*.spec.ts`          |
| Visual      | Playwright `toHaveScreenshot`         | every effect on the fixture page, light/dark options UI                 | `tests/e2e/visual.spec.ts`     |
| A11y        | `@axe-core/playwright`                | popup, options                                                          | `tests/e2e/a11y.spec.ts`       |
| Manual      | checklist                             | Firefox + Safari smoke per release                                      | `docs/testing.md#manual-smoke` |

**E2E specifics (D-107):**

- `SITEMARK_E2E=1 wxt build` adds `host_permissions: ["*://*.sitemark.test/*"]`, so permission
  requests resolve without a native prompt. The real (non-e2e) build is still asserted to have none
  (`tests/e2e/smoke.spec.ts`).
- `--host-resolver-rules=MAP *.sitemark.test 127.0.0.1` points fake hosts to the Playwright
  `webServer` that serves `tests/e2e/site/` (static HTML: a "prod-like" dashboard, an SPA page,
  lazy content, nested scroll, `<dialog>`).
- Popup UI is tested by opening `chrome-extension://<id>/popup.html?tabId=<n>` in a tab
  (the popup reads the target tab from the query string when present).

**Coverage gates:** `src/core` ≥ 90 % lines/branches, overall ≥ 80 %
(`vitest --coverage`, thresholds in `vitest.config.ts` from M1).

## 7. CI/CD (GitHub Actions)

| Workflow      | Trigger         | Jobs                                                                                                                                                                                      |
| ------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ci.yml`      | PR, push `main` | **check** (typecheck, lint, format, unit + coverage) · **build** matrix chrome/firefox/safari (+ `web-ext lint` for Firefox, size budget) · **e2e** (Playwright Chromium, uploads report) |
| `release.yml` | tag `v*`        | (M8) zips for all stores, GitHub Release with artifacts, optional `wxt submit` with store secrets, macOS job running the Safari converter + unsigned `xcodebuild`                         |

Dependabot (npm + actions, weekly, grouped).

## 8. Milestones

| #   | Milestone                   | Outcome                                                                                    | Main REQs                         |
| --- | --------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------- |
| M0  | **Foundation** ✅ (this PR) | Spec, plan, tasks, design, logo, scaffold, CI, smoke tests                                 | I18N-001, PRIV-001                |
| M1  | **Core domain**             | schema, defaults, migrations, URL patterns, matching, color, compose, import/export (pure) | URL, DATA, MARK-011/014, PROF-005 |
| M2  | **Platform layer**          | store, permissions, registration sync, tabs, messaging                                     | PRIV-002..006, DATA-001           |
| M3  | **Marker renderer**         | all effects, tracker, SPA, missing elements, hide, live updates                            | RND, MARK-002..010                |
| M4  | **Picker**                  | selector generator, picker state machine, panel, shortcut                                  | PICK, CMD                         |
| M5  | **Popup**                   | status, toggles, mark this site, pick, hide, restricted pages                              | POP                               |
| M6  | **Options**                 | profiles, patterns, mark editor + preview, settings, data                                  | OPT, PROF, MARK-012/013           |
| M7  | **Polish & cross-browser**  | nl complete, a11y, visual baselines, Firefox/Safari fixes, perf/size budgets               | A11Y, THEME, NFR                  |
| M8  | **Release**                 | privacy policy, store assets, release workflow, Safari project, v1.0.0                     | PRIV-007, NFR-006                 |

Each milestone ends with: all its tasks' Red/Green/Refactor ticked, `pnpm check` + e2e green,
`pnpm progress` showing its REQs covered, and a tagged pre-release (`v0.<M>.0`).

## 9. Risks

| Risk                                                         | Mitigation                                                                                                      |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Firefox closes the popup during `permissions.request`        | Fallback grant page (D-106), e2e + manual smoke                                                                 |
| Safari needs macOS/Xcode and an Apple developer account      | Keep Safari-specific code at zero; macOS CI job builds an unsigned project; signing is manual                   |
| Generated selectors break after deploys                      | Stable-attribute preference, editable selector, "not found" status + Re-pick (D-017)                            |
| Page top-layer elements (`<dialog>`, fullscreen) cover marks | Popover top layer (D-108); fullscreen is accepted as out of scope                                               |
| ReDoS through imported regex                                 | Length cap, import preview highlights regex, and a regex that is slow on a probe URL is rejected (TBD in T-015) |
| Frameworks remove foreign nodes from `<html>`                | `MutationObserver` re-attaches the host                                                                         |
| WXT or browser API churn                                     | Pin minor versions and use Dependabot. `platform/` isolates the APIs                                            |
