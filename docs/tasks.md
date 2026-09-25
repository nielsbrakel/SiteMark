# SiteMark — Implementation tasks

> Source of truth for progress. Each row is one TDD cycle (or a setup chore).
> Run **`pnpm progress`** for a summary and a requirement traceability report.

**How to use** (full protocol in [testing.md](testing.md#tdd-protocol))

1. Take the first row with a ☐ (top to bottom; rows within a milestone are ordered by dependency).
2. 🔴 **Red:** write the failing test(s) listed in _Tests_. Name the `describe` after the REQ ID.
   Watch them fail for the right reason, commit `test(T-xxx): …`, and tick 🔴.
3. 🟢 **Green:** write the minimum code to pass, commit `feat(T-xxx): …`, and tick 🟢.
4. 🔵 **Refactor:** clean up with tests still green and `pnpm check` passing, commit `refactor(T-xxx): …`, and tick 🔵.

Legend: ☐ todo · ✅ done · n/a not applicable (setup chores have no red step).
Update this file in the **same commit** as the step it records.

---

## M0 — Foundation

| Task  | Description                                                                            | REQs                        | Tests                                | 🔴  | 🟢  | 🔵  |
| ----- | -------------------------------------------------------------------------------------- | --------------------------- | ------------------------------------ | --- | --- | --- |
| T-001 | Spec, plan, decisions, design and tasks docs                                           | —                           | —                                    | n/a | ✅  | ✅  |
| T-002 | Scaffold WXT + React + TS (MV3 on all browsers), ESLint, Prettier                      | REQ-NFR-001                 | build all 3 targets                  | n/a | ✅  | ✅  |
| T-003 | Vitest + RTL + happy-dom + fake browser setup, popup render smoke                      | REQ-NFR-004                 | `src/entrypoints/popup/App.test.tsx` | n/a | ✅  | ✅  |
| T-004 | Playwright extension fixture. Manifest privacy e2e (no host access, no static scripts) | REQ-PRIV-001                | `tests/e2e/smoke.spec.ts`            | ✅  | ✅  | ✅  |
| T-005 | Design tokens (light/dark, AA contrast) + base CSS primitives                          | REQ-THEME-002, REQ-A11Y-003 | —                                    | n/a | ✅  | ✅  |
| T-006 | Logo (icon, small icon, wordmark) + rendered PNG icons                                 | —                           | —                                    | n/a | ✅  | ✅  |
| T-007 | `_locales` en + nl, parity test                                                        | REQ-I18N-001                | `tests/unit/locales.test.ts`         | n/a | ✅  | ✅  |
| T-008 | GitHub Actions CI, PR template, Dependabot                                             | REQ-NFR-004                 | CI green                             | n/a | ✅  | ✅  |
| T-009 | `pnpm progress` traceability script                                                    | —                           | —                                    | n/a | ✅  | ✅  |

## M1 — Core domain (pure TypeScript, `src/core`)

| Task  | Description                                                                                                | REQs                                     | Tests                             | 🔴  | 🟢  | 🔵  |
| ----- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------- | --------------------------------- | --- | --- | --- |
| T-010 | Wildcard pattern parse + match (spec §5.1 example table as test table)                                     | REQ-URL-001                              | `src/core/url-pattern.test.ts`    | ☐   | ☐   | ☐   |
| T-011 | Bare-host shorthand expansion                                                                              | REQ-URL-002                              | `src/core/url-pattern.test.ts`    | ☐   | ☐   | ☐   |
| T-012 | Pattern validation with typed error codes (mapped to i18n keys)                                            | REQ-URL-003                              | `src/core/url-pattern.test.ts`    | ☐   | ☐   | ☐   |
| T-013 | `toOriginPattern()` for permissions                                                                        | REQ-URL-005                              | `src/core/url-pattern.test.ts`    | ☐   | ☐   | ☐   |
| T-014 | Regex patterns: compile, 500-char cap, fragment stripped, origins required                                 | REQ-URL-004                              | `src/core/url-pattern.test.ts`    | ☐   | ☐   | ☐   |
| T-015 | Regex safety probe (reject catastrophic backtracking on a probe URL)                                       | REQ-URL-004, REQ-NFR-005                 | `src/core/url-pattern.test.ts`    | ☐   | ☐   | ☐   |
| T-016 | `matchProfiles(url, profiles)`: enabled only, priority order, reports matched pattern                      | REQ-URL-006                              | `src/core/matching.test.ts`       | ☐   | ☐   | ☐   |
| T-017 | Exclude patterns (Could)                                                                                   | REQ-URL-008                              | `src/core/matching.test.ts`       | ☐   | ☐   | ☐   |
| T-018 | zod schema for state/profile/mark/style: ranges, hex colors, text lengths, ≥ 1 effect                      | REQ-MARK-001                             | `src/core/schema.test.ts`         | ☐   | ☐   | ☐   |
| T-019 | Page-only effects rejected on element targets                                                              | REQ-MARK-014                             | `src/core/schema.test.ts`         | ☐   | ☐   | ☐   |
| T-020 | Profile invariants: enabled ⇒ ≥ 1 pattern. Name 1..40 chars                                                | REQ-PROF-002                             | `src/core/schema.test.ts`         | ☐   | ☐   | ☐   |
| T-021 | Contrast ratio + `autoTextColor()`                                                                         | REQ-MARK-011                             | `src/core/color.test.ts`          | ☐   | ☐   | ☐   |
| T-022 | Color presets, default mark, default state, id generator                                                   | REQ-MARK-012                             | `src/core/defaults.test.ts`       | ☐   | ☐   | ☐   |
| T-023 | Profile operations: create, update, delete, reorder, duplicate (pure reducers)                             | REQ-PROF-001, REQ-PROF-004, REQ-PROF-006 | `src/core/profiles.test.ts`       | ☐   | ☐   | ☐   |
| T-024 | `compose(matches)` stacking rules (plan §4)                                                                | REQ-PROF-005                             | `src/core/compose.test.ts`        | ☐   | ☐   | ☐   |
| T-025 | Migration runner (+ v0 fixture → v1)                                                                       | REQ-DATA-002                             | `src/core/migrations.test.ts`     | ☐   | ☐   | ☐   |
| T-026 | `buildExport()` envelope + `exportFilename(date)`                                                          | REQ-DATA-003                             | `src/core/import-export.test.ts`  | ☐   | ☐   | ☐   |
| T-027 | `parseImport()`: size cap, JSON errors, schema errors (readable paths), migrate older versions             | REQ-DATA-004                             | `src/core/import-export.test.ts`  | ☐   | ☐   | ☐   |
| T-028 | `mergeStates()`: merge (ID clash → new IDs) and replace. Import preview summary                            | REQ-DATA-004                             | `src/core/import-export.test.ts`  | ☐   | ☐   | ☐   |
| T-029 | `originsToRequest(before, after)` for batched import grants                                                | REQ-DATA-005                             | `src/core/import-export.test.ts`  | ☐   | ☐   | ☐   |
| T-030 | Architecture guard: `core` imports nothing from `platform`/`content`/`ui`/`wxt/browser` (lint rule + test) | REQ-NFR-004                              | `tests/unit/architecture.test.ts` | ☐   | ☐   | ☐   |
| T-031 | Coverage thresholds (core ≥ 90 %, overall ≥ 80 %) in `vitest.config.ts` and CI                             | REQ-NFR-004                              | CI                                | n/a | ☐   | ☐   |

## M2 — Platform layer (`src/platform`, fake browser)

| Task  | Description                                                                                             | REQs                       | Tests                                                      | 🔴  | 🟢  | 🔵  |
| ----- | ------------------------------------------------------------------------------------------------------- | -------------------------- | ---------------------------------------------------------- | --- | --- | --- |
| T-032 | `store`: load/save through `defineItem` (v1 + migrations), defaults on empty                            | REQ-DATA-001, REQ-DATA-002 | `src/platform/store.test.ts`                               | ☐   | ☐   | ☐   |
| T-033 | Corrupt data → defaults + raw copy under `sitemark:backup` + error flag                                 | REQ-DATA-001               | `src/platform/store.test.ts`                               | ☐   | ☐   | ☐   |
| T-034 | Only `storage.local` is ever written (spy on `storage.sync`)                                            | REQ-PRIV-006               | `src/platform/store.test.ts`                               | ☐   | ☐   | ☐   |
| T-035 | `store.watch()` emits validated state on change                                                         | REQ-RND-007                | `src/platform/store.test.ts`                               | ☐   | ☐   | ☐   |
| T-036 | `permissions`: granted status per pattern, `requestOrigins()`, `revokeOrigins()`                        | REQ-PRIV-002               | `src/platform/permissions.test.ts`                         | ☐   | ☐   | ☐   |
| T-037 | `unusedOrigins(state, granted)` for the revoke prompt                                                   | REQ-PRIV-004               | `src/platform/permissions.test.ts`                         | ☐   | ☐   | ☐   |
| T-038 | `desiredMatches()` + `syncRegistration()` (register/update/unregister `sitemark-marker`)                | REQ-PRIV-003               | `src/platform/registration.test.ts`                        | ☐   | ☐   | ☐   |
| T-039 | Background wiring: re-sync on installed/startup/permission/state events. Inject into open tabs on grant | REQ-PRIV-003               | `src/entrypoints/background.test.ts`                       | ☐   | ☐   | ☐   |
| T-040 | Restricted-URL detection (`chrome://`, `about:`, stores, `view-source:`, PDF viewer, …)                 | REQ-POP-005                | `src/platform/tabs.test.ts`                                | ☐   | ☐   | ☐   |
| T-041 | Messaging protocol + background handlers `getTabStatus`, `setHidden` (session storage, cleared on nav)  | REQ-RND-008                | `src/entrypoints/background.test.ts`                       | ☐   | ☐   | ☐   |
| T-042 | No-network guard: source scan (fetch/XHR/WebSocket/sendBeacon/EventSource/remote URLs) + manifest CSP   | REQ-PRIV-005, REQ-NFR-005  | `tests/unit/no-network.test.ts`, `tests/e2e/smoke.spec.ts` | ☐   | ☐   | ☐   |

## M3 — Marker renderer (`src/content/marker`)

| Task  | Description                                                                                                   | REQs                       | Tests                                             | 🔴  | 🟢  | 🔵  |
| ----- | ------------------------------------------------------------------------------------------------------------- | -------------------------- | ------------------------------------------------- | --- | --- | --- |
| T-043 | E2E infra: fixture site (`tests/e2e/site`), `webServer`, `*.sitemark.test` host mapping, `SITEMARK_E2E` build | —                          | `tests/e2e/fixtures.ts`                           | n/a | ☐   | ☐   |
| T-044 | Host: `<sitemark-root>`, closed shadow root, `:host{all:initial}`, re-attach when removed                     | REQ-RND-001                | `src/content/marker/host.test.ts`                 | ☐   | ☐   | ☐   |
| T-045 | Top layer through Popover API with z-index fallback                                                           | REQ-RND-006                | `host.test.ts`, `tests/e2e/marker.spec.ts`        | ☐   | ☐   | ☐   |
| T-046 | No match → no DOM, no observers. Errors caught + `[SiteMark]` logs                                            | REQ-RND-009                | `src/content/marker/marker.test.ts`               | ☐   | ☐   | ☐   |
| T-047 | Banner effect (top/bottom, compact/regular, stacking, collapse chevron)                                       | REQ-MARK-005, REQ-A11Y-006 | `page-effects.test.ts`                            | ☐   | ☐   | ☐   |
| T-048 | Frame effect (nesting by priority)                                                                            | REQ-MARK-006               | `page-effects.test.ts`                            | ☐   | ☐   | ☐   |
| T-049 | Ribbon effect (4 corners, page + element, corner winner)                                                      | REQ-MARK-002               | `page-effects.test.ts`, `element-effects.test.ts` | ☐   | ☐   | ☐   |
| T-050 | Tint effect (page + element)                                                                                  | REQ-MARK-004               | `page-effects.test.ts`, `element-effects.test.ts` | ☐   | ☐   | ☐   |
| T-051 | Stripes effect (edge / full, element)                                                                         | REQ-MARK-007               | `page-effects.test.ts`, `element-effects.test.ts` | ☐   | ☐   | ☐   |
| T-052 | Watermark effect                                                                                              | REQ-MARK-008               | `page-effects.test.ts`                            | ☐   | ☐   | ☐   |
| T-053 | Title prefix: apply, survive title changes, restore                                                           | REQ-MARK-009               | `document-effects.test.ts`                        | ☐   | ☐   | ☐   |
| T-054 | Favicon tint: canvas dot, CORS fallback SVG, restore                                                          | REQ-MARK-010               | `document-effects.test.ts`                        | ☐   | ☐   | ☐   |
| T-055 | Outline effect (width/style/pulse) + reduced motion                                                           | REQ-MARK-003, REQ-A11Y-005 | `element-effects.test.ts`                         | ☐   | ☐   | ☐   |
| T-056 | Tracker: rAF-batched positioning through scroll/resize/RO. Hide when detached/hidden                          | REQ-RND-003                | `tracker.test.ts`, `tests/e2e/marker.spec.ts`     | ☐   | ☐   | ☐   |
| T-057 | Missing element: debounced MO retry, status `found`/`missing`                                                 | REQ-RND-005                | `element-effects.test.ts`, e2e                    | ☐   | ☐   | ☐   |
| T-058 | SPA URL watch (navigate API, popstate, hashchange, polling fallback) → re-match                               | REQ-RND-004                | `url-watch.test.ts`, `tests/e2e/marker.spec.ts`   | ☐   | ☐   | ☐   |
| T-059 | Live updates: storage change → diff re-render ≤ 250 ms                                                        | REQ-RND-007                | `marker.test.ts`, e2e                             | ☐   | ☐   | ☐   |
| T-060 | Hide temporarily (content side) incl. title/favicon restore                                                   | REQ-RND-008                | `marker.test.ts`, e2e                             | ☐   | ☐   | ☐   |
| T-061 | Safety: `pointer-events:none`, no layout shift (page element rects unchanged), `textContent` only             | REQ-RND-002, REQ-RND-011   | `marker.test.ts`, `tests/e2e/marker.spec.ts`      | ☐   | ☐   | ☐   |
| T-062 | Hidden in print                                                                                               | REQ-RND-010                | `tests/e2e/marker.spec.ts` (`emulateMedia`)       | ☐   | ☐   | ☐   |

## M4 — Picker (`src/content/picker`, `src/core/selector.ts`)

| Task  | Description                                                                                        | REQs                        | Tests                       | 🔴  | 🟢  | 🔵  |
| ----- | -------------------------------------------------------------------------------------------------- | --------------------------- | --------------------------- | --- | --- | --- |
| T-063 | `isStableToken()`: reject hashed/generated ids and classes                                         | REQ-PICK-004                | `src/core/selector.test.ts` | ☐   | ☐   | ☐   |
| T-064 | `generateSelector()`: attribute priority, uniqueness, ≤ 300 chars, `nth-of-type` fallback          | REQ-PICK-004                | `src/core/selector.test.ts` | ☐   | ☐   | ☐   |
| T-065 | Picker hover highlight + tooltip                                                                   | REQ-PICK-002                | `picker.test.ts`            | ☐   | ☐   | ☐   |
| T-066 | Picker keyboard navigation (↑ ↓ ← → Enter Esc)                                                     | REQ-PICK-002, REQ-A11Y-002  | `picker.test.ts`            | ☐   | ☐   | ☐   |
| T-067 | Event suppression while picking + full cleanup on exit                                             | REQ-PICK-003                | `picker.test.ts`, e2e       | ☐   | ☐   | ☐   |
| T-068 | Mini panel: editable selector + live match count, profile choice, preset, Save/Cancel/More options | REQ-PICK-005, REQ-THEME-001 | `panel.test.ts`             | ☐   | ☐   | ☐   |
| T-069 | Panel: origin-not-granted notice + "Allow on this site" → grant page                               | REQ-PICK-006                | `panel.test.ts`             | ☐   | ☐   | ☐   |
| T-070 | Background: inject picker from popup message and `start-picker` command                            | REQ-PICK-001, REQ-CMD-001   | `background.test.ts`        | ☐   | ☐   | ☐   |
| T-071 | Re-pick replaces an existing mark's selector                                                       | REQ-PICK-007                | `panel.test.ts`             | ☐   | ☐   | ☐   |
| T-072 | E2E: pick → save → overlay visible on reload                                                       | REQ-PICK-001, REQ-PICK-005  | `tests/e2e/picker.spec.ts`  | ☐   | ☐   | ☐   |

## M5 — Popup (`src/entrypoints/popup`, `src/ui`)

| Task  | Description                                                                                                  | REQs                        | Tests                                      | 🔴  | 🟢  | 🔵  |
| ----- | ------------------------------------------------------------------------------------------------------------ | --------------------------- | ------------------------------------------ | --- | --- | --- |
| T-073 | UI kit: Button, IconButton, Switch, Card, Field, Segmented, Slider, Dialog, Toast (tokens only, focus rings) | REQ-THEME-002, REQ-A11Y-003 | `src/ui/components/*.test.tsx`             | ☐   | ☐   | ☐   |
| T-074 | Hooks: `useSiteMarkState`, `useCurrentTab` (supports `?tabId=` for tests), `useTheme`                        | REQ-THEME-001               | `src/ui/hooks/*.test.tsx`                  | ☐   | ☐   | ☐   |
| T-075 | Matching profiles list with toggles + empty state                                                            | REQ-POP-001, REQ-PROF-003   | `popup/App.test.tsx`                       | ☐   | ☐   | ☐   |
| T-076 | "Mark this site" flow (profile + default ribbon + permission)                                                | REQ-POP-006                 | `popup/App.test.tsx`, e2e                  | ☐   | ☐   | ☐   |
| T-077 | Permission warning + Allow. Firefox → `grant.html` fallback page                                             | REQ-POP-004, REQ-PRIV-002   | `popup/App.test.tsx`, `grant/App.test.tsx` | ☐   | ☐   | ☐   |
| T-078 | Element mark status list + Re-pick                                                                           | REQ-POP-002, REQ-PICK-007   | `popup/App.test.tsx`                       | ☐   | ☐   | ☐   |
| T-079 | Actions: Pick element, Hide on this tab, Settings                                                            | REQ-POP-003, REQ-RND-008    | `popup/App.test.tsx`                       | ☐   | ☐   | ☐   |
| T-080 | Restricted page state                                                                                        | REQ-POP-005                 | `popup/App.test.tsx`                       | ☐   | ☐   | ☐   |
| T-081 | E2E: popup flows on the fixture site                                                                         | REQ-POP-001, REQ-POP-006    | `tests/e2e/popup.spec.ts`                  | ☐   | ☐   | ☐   |

## M6 — Options page (`src/entrypoints/options`)

| Task  | Description                                                                           | REQs                                    | Tests                                  | 🔴  | 🟢  | 🔵  |
| ----- | ------------------------------------------------------------------------------------- | --------------------------------------- | -------------------------------------- | --- | --- | --- |
| T-082 | Hash router + layout (sidebar/editor), deep links                                     | REQ-OPT-001                             | `options/router.test.tsx`              | ☐   | ☐   | ☐   |
| T-083 | Profile list: add, rename, delete with confirm + 10 s undo, enable switch             | REQ-PROF-001, REQ-PROF-003              | `options/ProfileList.test.tsx`         | ☐   | ☐   | ☐   |
| T-084 | Reorder: drag & drop + Move up/down buttons                                           | REQ-PROF-004, REQ-A11Y-002              | `options/ProfileList.test.tsx`, e2e    | ☐   | ☐   | ☐   |
| T-085 | Duplicate profile (UI)                                                                | REQ-PROF-006                            | `options/ProfileList.test.tsx`         | ☐   | ☐   | ☐   |
| T-086 | Pattern editor: wildcard/regex, inline errors, regex origins                          | REQ-OPT-002, REQ-URL-003, REQ-URL-004   | `options/PatternEditor.test.tsx`       | ☐   | ☐   | ☐   |
| T-087 | Pattern permission status + Allow                                                     | REQ-PRIV-002                            | `options/PatternEditor.test.tsx`       | ☐   | ☐   | ☐   |
| T-088 | Live URL tester                                                                       | REQ-URL-007                             | `options/PatternEditor.test.tsx`       | ☐   | ☐   | ☐   |
| T-089 | Mark list + mark editor: target page/element, selector syntax check                   | REQ-OPT-003                             | `options/MarkEditor.test.tsx`          | ☐   | ☐   | ☐   |
| T-090 | Color presets + custom hex + text color                                               | REQ-MARK-012, REQ-MARK-011              | `options/MarkEditor.test.tsx`          | ☐   | ☐   | ☐   |
| T-091 | Effect controls (per effect settings, page-only effects disabled for element targets) | REQ-OPT-003, REQ-MARK-014               | `options/MarkEditor.test.tsx`          | ☐   | ☐   | ☐   |
| T-092 | Live preview (reuses marker CSS)                                                      | REQ-MARK-013                            | `options/MarkPreview.test.tsx`, visual | ☐   | ☐   | ☐   |
| T-093 | Autosave + "Saved" status. Field-local validation                                     | REQ-OPT-006                             | `options/*.test.tsx`                   | ☐   | ☐   | ☐   |
| T-094 | Settings: theme switch, shortcut info per browser                                     | REQ-OPT-004, REQ-THEME-001              | `options/Settings.test.tsx`            | ☐   | ☐   | ☐   |
| T-095 | Data: export download                                                                 | REQ-OPT-005, REQ-DATA-003               | `options/DataPanel.test.tsx`           | ☐   | ☐   | ☐   |
| T-096 | Data: import preview, merge/replace, one batched permission prompt                    | REQ-OPT-005, REQ-DATA-004, REQ-DATA-005 | `options/DataPanel.test.tsx`, e2e      | ☐   | ☐   | ☐   |
| T-097 | Data: reset everything (double confirm)                                               | REQ-OPT-005                             | `options/DataPanel.test.tsx`           | ☐   | ☐   | ☐   |
| T-098 | Revoke unused origins prompt                                                          | REQ-PRIV-004                            | `options/*.test.tsx`                   | ☐   | ☐   | ☐   |
| T-099 | Welcome / first-run empty state                                                       | REQ-OPT-001                             | `options/App.test.tsx`                 | ☐   | ☐   | ☐   |
| T-100 | Corrupt-data banner with "restore defaults / download backup"                         | REQ-DATA-001                            | `options/App.test.tsx`                 | ☐   | ☐   | ☐   |
| T-115 | Export a single profile (Could)                                                       | REQ-DATA-006                            | `options/DataPanel.test.tsx`           | ☐   | ☐   | ☐   |

## M7 — Polish & cross-browser

| Task  | Description                                                              | REQs                        | Tests                              | 🔴  | 🟢  | 🔵  |
| ----- | ------------------------------------------------------------------------ | --------------------------- | ---------------------------------- | --- | --- | --- |
| T-101 | No hard-coded UI strings (lint rule / JSX text scan)                     | REQ-I18N-002                | `tests/unit/i18n-literals.test.ts` | ☐   | ☐   | ☐   |
| T-102 | User content never passed through `t()`                                  | REQ-I18N-003                | component tests                    | ☐   | ☐   | ☐   |
| T-103 | Token contrast test (parse `tokens.css`, assert AA pairs in both themes) | REQ-A11Y-001                | `tests/unit/contrast.test.ts`      | ☐   | ☐   | ☐   |
| T-104 | axe checks: popup + options, light + dark                                | REQ-A11Y-004                | `tests/e2e/a11y.spec.ts`           | ☐   | ☐   | ☐   |
| T-105 | Visual baselines for every effect + UI themes                            | REQ-MARK-002, REQ-THEME-001 | `tests/e2e/visual.spec.ts`         | ☐   | ☐   | ☐   |
| T-106 | Bundle size budget check in CI                                           | REQ-NFR-002                 | `scripts/size-budget.mjs`          | ☐   | ☐   | ☐   |
| T-107 | Performance probes (no-match < 2 ms, 10 marks scroll < 1 ms/frame)       | REQ-NFR-003                 | `tests/e2e/perf.spec.ts`           | ☐   | ☐   | ☐   |
| T-108 | Firefox: `web-ext lint` in CI + manual smoke + fixes                     | REQ-NFR-001                 | CI + checklist                     | n/a | ☐   | ☐   |
| T-109 | Safari: converter build on macOS + manual smoke + fixes                  | REQ-NFR-001                 | checklist                          | n/a | ☐   | ☐   |
| T-110 | Dutch translation review (native pass)                                   | REQ-I18N-001                | `tests/unit/locales.test.ts`       | n/a | ☐   | ☐   |

## M8 — Release

| Task  | Description                                                                  | REQs         | Tests                        | 🔴  | 🟢  | 🔵  |
| ----- | ---------------------------------------------------------------------------- | ------------ | ---------------------------- | --- | --- | --- |
| T-111 | `PRIVACY.md` + store privacy answers                                         | REQ-PRIV-007 | review                       | n/a | ☐   | ☐   |
| T-112 | Store listing texts (en/nl), screenshots (from visual tests), promo tile     | REQ-NFR-006  | review                       | n/a | ☐   | ☐   |
| T-113 | `release.yml`: zips, GitHub Release, optional `wxt submit`, macOS Safari job | REQ-NFR-006  | dry-run on tag `v0.9.0-rc.1` | n/a | ☐   | ☐   |
| T-114 | CHANGELOG, version 1.0.0, submit to stores                                   | REQ-NFR-006  | release checklist            | n/a | ☐   | ☐   |
