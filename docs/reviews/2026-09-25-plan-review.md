# Plan review — 2026-09-25

Seven independent specialist reviews of the M0 plan (spec, plan, tasks, decisions, design,
scaffold), followed by an owner Q&A. This file records **what was found and where it went**.
The resulting decisions are D-201…D-242 in [decisions.md](../decisions.md).

| Reviewer                     | Verdict (short)                                                                                                                                |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 🏛️ Architecture / clean code | Solid base. Needed: a single-writer concurrency model, layering that is actually enforceable, a type-safe mark model, and a use-case layer.    |
| 🔒 Security & privacy        | Privacy posture sound, but content scripts were trusted. Problems: picker side effects, regex ReDoS, import origins, supply chain.             |
| 🌐 Browser platform          | Chrome OK, Firefox mostly OK, Safari weakest. One blocker: the manifest hook stripped _all_ host permissions.                                  |
| 🧪 Test architecture         | Pyramid sound, enforcement layer missing. Needed: a browser-mode test layer, fakes, a shadow-root testability flag, e2e build isolation.       |
| 🎨 UX, design & a11y         | Blockers: "Mark this site" labels everything PRODUCTION, the preset colors fail color blindness, and focus/boundaries vanish in forced colors. |
| 🛠️ Tooling & DX              | Rules existed only as prose. Add an M0.5 hardening milestone: strict lint, layering zones, hooks, CI pinning, Dependabot policy.               |
| 📋 Product / spec            | About 6 contradictions (priorities vs. owner asks, popup toggle vs. matching, "never mutate page"). Underspecified URL and element semantics.  |

## Owner decisions (Q&A)

| Question                           | Owner's answer                                                                                                     | Decision    |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------- |
| "Mark this site" default           | **Neutral ribbon with the host name** (not an environment chooser)                                                 | D-201       |
| Term for profile                   | **Site group**                                                                                                     | D-202       |
| Default marks of a new group       | **Ribbon only**                                                                                                    | D-203       |
| Global switch in popup             | **Removed.** The popup only has "Hide on this tab"                                                                 | D-204       |
| Preset palette                     | **Colorblind-safe 4 + custom** (red, amber, blue, slate)                                                           | D-205       |
| Selector matching several elements | **First match only**                                                                                               | D-206       |
| Hide duration                      | **Until reload / leaving the origin / closing the tab**; survives SPA routes                                       | D-207       |
| Hide shortcut                      | **Yes**, `toggle-hide`, no default key                                                                             | D-208       |
| Merge strategy                     | **Rebase-merge**                                                                                                   | D-209       |
| TDD enforcement                    | **Automated** (CI verifies red→green; status derived from git)                                                     | D-210       |
| Regex power                        | **Safe subset**                                                                                                    | D-211       |
| Broad patterns (`*`, `*.com`)      | **Forbidden entirely**                                                                                             | D-212       |
| Safari                             | **v1.1** (minimum Safari 18)                                                                                       | D-213       |
| Firefox automation                 | **Manual checklist only**                                                                                          | D-214       |
| Fullscreen                         | **Keep marks on top**                                                                                              | D-215       |
| v1 scope                           | **Keep everything in v1**                                                                                          | D-216       |
| Favicon                            | **Tint the original only.** If unreadable, leave it unchanged and show a popup notice                              | D-217       |
| Import ID clash                    | **Update existing** (upsert)                                                                                       | D-218       |
| Silent failures                    | **Toolbar badge "!"** in v1                                                                                        | D-219       |
| Engineering bundle                 | **Accept all** (single writer, need-to-know, enforced layering, typed mark model, read-only on newer schema, M0.5) | D-220…D-226 |
| Store publishing                   | **Automated `wxt submit`**, gated by a GitHub Environment                                                          | D-227       |
| Versioning                         | **Changesets**                                                                                                     | D-228       |

## Findings and their disposition

Legend: ✅ accepted, 👤 decided by the owner, ⚠️ accepted with a change, ⏭️ deferred, ❌ rejected. Targets are
requirement IDs, decision IDs or task IDs in the updated docs.

### Architecture (ARCH)

| ID      | Finding                                       | Disposition                                                                    |
| ------- | --------------------------------------------- | ------------------------------------------------------------------------------ |
| ARCH-01 | Lost updates: many writers of one storage key | ✅ D-220 background single writer, command queue → REQ-SEC-001, T-064          |
| ARCH-02 | WXT auto-imports defeat layering              | ✅ D-222 `imports:false` → T-011                                               |
| ARCH-03 | DOM exception in `core/selector.ts`           | ✅ Tokens stay in core; `generateSelector` moves to `content/picker` (plan §2) |
| ARCH-04 | No use-case layer                             | ✅ D-222 `src/app` with ports                                                  |
| ARCH-05 | Optional-bag `MarkStyle`                      | ✅ D-223 page/element discriminated union (spec §7)                            |
| ARCH-06 | Newer schema → data loss                      | ✅ D-224 → REQ-DATA-007                                                        |
| ARCH-07 | Two migration systems                         | ✅ D-224 one pipeline, supersedes D-103                                        |
| ARCH-08 | Hide state has two owners                     | ✅ D-207 content-script memory                                                 |
| ARCH-09 | Registration sync races                       | ✅ D-231 → T-068                                                               |
| ARCH-10 | Double injection / orphaned scripts           | ✅ REQ-RND-012 → T-078                                                         |
| ARCH-11 | Renderer lifecycle is prose                   | ✅ RenderPlan / diffPlan / EffectView (plan §3.3) → T-048, T-049, T-082        |
| ARCH-12 | ESLint not type-aware                         | ✅ T-012                                                                       |
| ARCH-13 | Hook deletes all host permissions             | ✅ Fixed in this review (filter `*://*/*` only)                                |
| ARCH-14 | Float opacities, unbranded IDs                | ✅ Integer percent, branded IDs (spec §7)                                      |
| ARCH-15 | `randomUUID` needs a secure context           | ✅ `IdGen` on `getRandomValues`, minted by background → T-031                  |
| ARCH-16 | Removing the last pattern of an enabled group | ✅ Auto-disable (REQ-GRP-002)                                                  |
| ARCH-17 | Picker states redundant                       | ✅ Pure `transition()` → T-056                                                 |
| ARCH-18 | No error policy                               | ✅ D-225 → T-030                                                               |
| ARCH-19 | `MessageKey` hand-maintained                  | ✅ T-024                                                                       |
| ARCH-20 | Strict flags implicit                         | ✅ T-010                                                                       |
| ARCH-21 | `ui` imports `content` CSS                    | ✅ `src/shared/marker-view`                                                    |
| ARCH-22 | `.nvmrc` gitignored                           | ❌ False positive (`.env*` doesn't match `.nvmrc`)                             |
| ARCH-23 | Task numbering                                | ✅ Tasks renumbered                                                            |

### Security (SEC)

| ID     | Finding                                        | Disposition                                                                        |
| ------ | ---------------------------------------------- | ---------------------------------------------------------------------------------- |
| SEC-01 | Picker event suppression can fire page actions | ✅ Glass-pane picker, focus capture → REQ-PICK-003, T-104, T-106                   |
| SEC-02 | Content scripts read/write all state           | ✅ D-220/D-221 → REQ-SEC-001/002, T-063, T-066                                     |
| SEC-03 | Regex probe doesn't work                       | 👤 D-211 safe subset (regexpp), origin prefilter, URL cap → T-037, T-038           |
| SEC-04 | Wildcard→RegExp backtracking                   | ✅ Linear matcher, caps → REQ-URL-010, T-033                                       |
| SEC-05 | Import social engineering with broad origins   | 👤 D-212 broad patterns forbidden → REQ-URL-009                                    |
| SEC-06 | Import hardening                               | ✅ REQ-SEC-004 → T-040, T-052                                                      |
| SEC-07 | CSS/bidi injection                             | ✅ REQ-SEC-004, REQ-RND-011, lint bans → T-012                                     |
| SEC-08 | Page interference with the host                | ✅ REQ-SEC-006 → T-078, T-101                                                      |
| SEC-09 | Strict-CSP sites                               | ⚠️ D-232: adopted sheets with `<style>` fallback (Firefox bug) → REQ-SEC-007       |
| SEC-10 | Favicon canvas makes a request                 | 👤 D-217 owner keeps tint-original. Documented in PRIVACY (REQ-PRIV-005 exception) |
| SEC-11 | No message sender validation                   | ✅ REQ-SEC-003 → T-065                                                             |
| SEC-12 | Panel spoofing / clickjacking                  | ✅ REQ-SEC-005 → T-108                                                             |
| SEC-13 | Source-scan no-network is weak                 | ✅ Built-output scan + CSP + e2e request log → T-017                               |
| SEC-14 | CI pinning                                     | ✅ REQ-SEC-009 → T-022                                                             |
| SEC-15 | pnpm hardening                                 | ✅ T-023                                                                           |
| SEC-16 | Store credentials / release integrity          | 👤 D-227 automated submit behind Environment `store` → REQ-SEC-008, T-153          |
| SEC-17 | Detection / title in history                   | ✅ Title prefix opt-in (D-203), documented (REQ-PRIV-007)                          |
| SEC-18 | WAR, frames, world                             | ✅ Manifest assertions → T-016                                                     |
| SEC-19 | `?tabId=` honored in prod                      | ✅ E2E builds only (plan §6)                                                       |
| SEC-20 | Title ping-pong                                | ✅ REQ-MARK-009 wording                                                            |
| SEC-21 | Exports contain hostnames                      | ✅ Warning (REQ-DATA-003)                                                          |

### Platform (PLAT)

| ID      | Finding                                            | Disposition                                                 |
| ------- | -------------------------------------------------- | ----------------------------------------------------------- |
| PLAT-01 | Hook strips dev/e2e host permissions               | ✅ Fixed in this review                                     |
| PLAT-02 | Permission request must be synchronous; popup dies | ✅ D-229 request-first, background finishes → T-067, T-069  |
| PLAT-03 | Safari per-site grants, no events                  | ✅ `permissions.contains` is live truth (plan §3.1)         |
| PLAT-04 | Registration races / Safari persistence            | ✅ D-231 → T-068                                            |
| PLAT-05 | Double injection                                   | ✅ REQ-RND-012                                              |
| PLAT-06 | Top-layer ordering, page CSS on host               | 👤 D-215 re-promotion incl. fullscreen → REQ-RND-006, T-080 |
| PLAT-07 | Firefox `adoptedStyleSheets` bug                   | ✅ D-232 feature-detect with `<style>` fallback             |
| PLAT-08 | Navigation API missing at the floors               | ✅ Polling is first-class (REQ-RND-004)                     |
| PLAT-09 | Hide state and `tabs.onUpdated`                    | ✅ D-207                                                    |
| PLAT-10 | Safari favicon unreliable                          | ✅ Best-effort on Safari (REQ-MARK-010)                     |
| PLAT-11 | Commands per browser                               | ✅ REQ-CMD-001/002, REQ-OPT-004                             |
| PLAT-12 | Deep links / options hash                          | ✅ `tabs.create` via background → T-075                     |
| PLAT-13 | Firefox e2e via Puppeteer BiDi                     | 👤 D-214 manual only                                        |
| PLAT-14 | fakeBrowser gaps                                   | ✅ T-014                                                    |
| PLAT-15 | Manifest floors, converter flags                   | ✅ Floors added in this review. Safari flags in M9          |
| PLAT-16 | Store packaging (AMO source)                       | ✅ T-152                                                    |
| PLAT-17 | Chrome 120 floor, no mobile                        | ✅ REQ-NFR-001                                              |
| PLAT-18 | Restricted detection needs `tab.url`               | ✅ `executeScript` failure is ground truth (REQ-POP-005)    |

### Testing (TEST)

| ID      | Finding                                       | Disposition                                                          |
| ------- | --------------------------------------------- | -------------------------------------------------------------------- |
| TEST-01 | E2E pre-grant vs privacy test                 | ✅ Separate e2e outDir; manifest tests on real builds → T-015, T-016 |
| TEST-02 | Closed shadow root untestable                 | ✅ D-226 `__SHADOW_MODE__` flag                                      |
| TEST-03 | Pre-grant hides not-granted states            | ✅ Only `prod.`/`test.` pre-granted, `new.` ungranted                |
| TEST-04 | fakeBrowser gaps                              | ✅ T-014                                                             |
| TEST-05 | happy-dom can't do layout etc.                | ✅ Vitest browser mode → T-013                                       |
| TEST-06 | TDD unenforceable                             | 👤 D-209/D-210 → T-019, T-020                                        |
| TEST-07 | Comment-based coverage                        | 👤 D-210 passing-test titles only                                    |
| TEST-08 | 345 manual ticks                              | 👤 D-210 status from git                                             |
| TEST-09 | Playwright config                             | ✅ T-015                                                             |
| TEST-10 | Gates after the code                          | ✅ Moved into M0.5                                                   |
| TEST-11 | Scan misses deps; zod JIT uses `new Function` | ✅ T-017, zod `jitless` (T-014)                                      |
| TEST-12 | Popup / shortcut / SW restart e2e             | ✅ E2E helpers → T-015                                               |
| TEST-13 | Visual drift                                  | ✅ Container-only baselines → T-147                                  |
| TEST-14 | Property, mutation, migration, contract tests | ✅ T-058, T-059, T-050, T-065                                        |
| TEST-15 | i18n mocking                                  | ✅ Global i18n fake → T-014                                          |
| TEST-16 | Manifest read via page body                   | ✅ Node test on files → T-016                                        |
| TEST-17 | Branded Chrome hangs                          | ✅ Timeout + docs → T-015                                            |
| TEST-18 | Test linting                                  | ✅ T-012                                                             |
| TEST-19 | Coverage globs                                | ✅ T-013                                                             |
| TEST-20 | CI caching / artifacts                        | ✅ T-022                                                             |
| TEST-21 | `core/selector.ts` DOM-bound                  | ✅ Same as ARCH-03                                                   |

### UX, design & accessibility (UX)

| ID    | Finding                                | Disposition                                                                     |
| ----- | -------------------------------------- | ------------------------------------------------------------------------------- |
| UX-01 | "Mark this site" labels PRODUCTION     | 👤 D-201 neutral host ribbon                                                    |
| UX-02 | Preset colors not colorblind-safe      | 👤 D-205. Tokens updated in this review                                         |
| UX-03 | Focus ring invisible in forced colors  | ✅ Outline-based focus, done in this review. REQ-A11Y-007                       |
| UX-04 | Control boundaries < 3:1               | ✅ `--sm-control-border`, done in this review. REQ-A11Y-008                     |
| UX-05 | Success/warning below AA               | ✅ Fixed in this review. Token contrast test → T-028                            |
| UX-06 | Dark mode flattens                     | ✅ `--sm-edge` highlight, done in this review                                   |
| UX-07 | Banner/ribbon cover the page UI        | ✅ Proximity fade (REQ-RND-013), one banner per edge (REQ-GRP-005)              |
| UX-08 | Silent unmarking                       | 👤 D-219 badge                                                                  |
| UX-09 | Ribbon text too long                   | ✅ ≤ 16 characters + auto-shrink (REQ-MARK-002)                                 |
| UX-10 | Autosave vs permission                 | ✅ Patterns commit through an explicit Add (REQ-OPT-002)                        |
| UX-11 | Permission moment / onboarding         | ✅ Pre-prompt microcopy, welcome tab (REQ-OPT-001)                              |
| UX-12 | Popup global switch                    | 👤 D-204                                                                        |
| UX-13 | Marks in forced colors                 | ✅ REQ-RND-014                                                                  |
| UX-14 | Marks low-contrast on some pages       | ✅ Keyline (REQ-RND-014)                                                        |
| UX-15 | Panel covers the selection / drag-only | ✅ REQ-A11Y-010, T-108                                                          |
| UX-16 | iframes / components                   | ✅ REQ-PICK-008                                                                 |
| UX-17 | Picker screen-reader support           | ✅ REQ-A11Y-011                                                                 |
| UX-18 | Hover color = a preset                 | ✅ Neutral two-tone hover (REQ-PICK-002)                                        |
| UX-19 | Plurals, lang/dir                      | ✅ REQ-I18N-004                                                                 |
| UX-20 | NL overflow in the popup               | ✅ Stacked actions + pseudo-locale test → T-145                                 |
| UX-21 | OTAP naming / localized defaults       | ⚠️ Default ribbon is the host name (D-201), so no default text needs localizing |
| UX-22 | Description > 132 characters           | ✅ Fixed in this review + REQ-I18N-005                                          |
| UX-23 | Tint/watermark ranges too strong       | ✅ New ranges (spec §7)                                                         |
| UX-24 | 16px logo                              | ✅ Redesigned in this review (16px ribbon only, mono, dark wordmark)            |
| UX-25 | Store art sizes                        | ✅ T-152                                                                        |
| UX-26 | Hardcoded shortcut hint                | ✅ `commands.getAll()` (REQ-CMD-001)                                            |
| UX-27 | UI accent = Production red             | ✅ UI accent moved to coral `#b8452f`, done in this review                      |
| UX-28 | 11px text, visually-hidden snippet     | ✅ Fixed in this review                                                         |

### Tooling & DX (DX)

| ID             | Finding                                            | Disposition                     |
| -------------- | -------------------------------------------------- | ------------------------------- |
| DX-01          | Auto-imports                                       | ✅ T-011                        |
| DX-02/03/04/18 | Type-aware lint, layering, security rules, plugins | ✅ T-012                        |
| DX-05          | Vitest projects                                    | ✅ T-013                        |
| DX-06          | Hook / e2e mode                                    | ✅ Hook fixed now; mode → T-015 |
| DX-07          | Dependabot majors                                  | ✅ T-023                        |
| DX-08          | commitlint / hooks                                 | ✅ T-021 (lefthook)             |
| DX-09/10/11    | CI hardening, caching, size-limit                  | ✅ T-018, T-022                 |
| DX-12          | `check:ci`                                         | ✅ T-022                        |
| DX-13          | `forbidOnly`, stale builds                         | ✅ T-015                        |
| DX-14          | TS flags                                           | ✅ T-010                        |
| DX-15/16       | i18n key type, `mount()`, lang                     | ✅ T-024                        |
| DX-17          | CSS Modules, stylelint                             | ✅ T-025                        |
| DX-19          | progress.mjs robustness                            | ✅ T-019                        |
| DX-20          | pnpm policy                                        | ✅ T-023                        |
| DX-21          | package.json nits                                  | ✅ T-010                        |
| DX-22          | Repo docs                                          | ✅ T-027                        |
| DX-23          | knip                                               | ✅ T-026                        |

### Product / spec (PROD)

| ID      | Finding                                   | Disposition                                                  |
| ------- | ----------------------------------------- | ------------------------------------------------------------ |
| PROD-01 | Disabled groups invisible in popup        | ✅ `patternMatches` vs `isActive` (REQ-URL-006, REQ-POP-001) |
| PROD-02 | Owner asks marked only S                  | 👤 D-216 all v1 items are M                                  |
| PROD-03 | C items both in v1 and Later              | 👤 D-216 kept in v1 (C). Removed from "Later"                |
| PROD-04 | "Never mutate page" vs title/favicon      | ✅ D-013 reworded via D-230                                  |
| PROD-05 | Page outline undefined                    | ✅ The type system allows outline only on elements (D-223)   |
| PROD-06 | Title spacing, favicon fallback           | ✅ REQ-MARK-009. D-217 has no fallback                       |
| PROD-07 | Favicon request vs "no network"           | 👤 D-217 documented exception                                |
| PROD-08 | 0 patterns contradiction                  | ✅ REQ-GRP-002                                               |
| PROD-09 | "Mark this site" details                  | ✅ REQ-POP-006                                               |
| PROD-10 | URL edge cases                            | ✅ REQ-URL-001/002 table extended                            |
| PROD-11 | Multi-match                               | 👤 D-206                                                     |
| PROD-12 | Per-mark path filter                      | ⏭️ Later                                                     |
| PROD-13 | Composition order                         | ✅ Normative table (spec §5.2)                               |
| PROD-14 | Banner collapse details                   | ✅ REQ-MARK-005                                              |
| PROD-15 | Hide semantics                            | 👤 D-207                                                     |
| PROD-16 | Panel presets undefined                   | ✅ REQ-PICK-005                                              |
| PROD-17 | activeTab-only mark vanishes after reload | ✅ REQ-PICK-006 notice                                       |
| PROD-18 | New group position; undo vs revoke        | ✅ REQ-GRP-001, REQ-PRIV-004                                 |
| PROD-19 | When a pattern is "saved"                 | ✅ Explicit Add                                              |
| PROD-20 | Environment behaviour                     | ✅ New §5.15 ENV                                             |
| PROD-21 | Dialog above marks                        | 👤 D-215                                                     |
| PROD-22 | CSP                                       | ✅ REQ-SEC-007                                               |
| PROD-23 | Shortcut feedback                         | ✅ REQ-CMD-001                                               |
| PROD-24 | Reset / uninstall / what's new            | ✅ REQ-OPT-005 (reset revokes). No in-app changelog          |
| PROD-25 | Scale performance                         | ✅ REQ-NFR-003                                               |
| PROD-26 | Store readiness M                         | ✅ REQ-NFR-006 M                                             |
| PROD-27 | Success metrics / diagnostics             | ✅ Spec §2 metrics, REQ-OPT-007                              |
| PROD-28 | Import clash                              | 👤 D-218                                                     |
| PROD-29 | Search; small-element ribbons             | ⏭️ Search later. ✅ Small-target dot (REQ-MARK-002)          |
