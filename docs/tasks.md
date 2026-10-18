# SiteMark — Implementation tasks

> The task list: one row per TDD cycle (or setup chore). Run **`pnpm progress`** for status and
> requirement traceability. Renumbered after the [2026-09-25 plan review](reviews/2026-09-25-plan-review.md).
> The website has its own list: [website/tasks.md](website/tasks.md) (W1 before T-152, W2 after M6, D-253).

**How it works** (full protocol: [testing.md](testing.md#tdd-protocol))

1. Take the first ☐ row (rows within a milestone are ordered by dependency).
2. 🔴 `test(T-xxx): red — …`: failing tests + typed stubs (typecheck and lint pass; only tests fail).
3. 🟢 `feat(T-xxx): green — …`: the minimum code to pass.
4. 🔵 `refactor(T-xxx): …`: optional cleanup, tests stay green.
5. Set the row's **Status** to ✅ in the green (or refactor) commit, or run `pnpm progress --sync`.
   Status is **derived from git** (D-210): a task is done once its last task-scoped commit is a green,
   refactor or chore commit. `pnpm progress --strict` fails when this column disagrees with git, so run
   `pnpm check` after committing the green step (before it, git still says the task is red).

Setup chores (`chore(T-xxx)`) have no red step unless they add a test.
Status: ☐ todo · ✅ done.

---

The finished milestones M0 – M6 are in [archive/tasks.md](archive/tasks.md).

## M7 — Polish

| Task  | Description                                                                                            | REQs                        | Tests                                                                                                                    | Status |
| ----- | ------------------------------------------------------------------------------------------------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------ |
| T-145 | Dutch copy review + pseudo-locale (+40 %) visual check in the 360 px popup                             | REQ-I18N-001, REQ-I18N-004  | `tests/e2e/i18n.spec.ts`                                                                                                 | ✅     |
| T-146 | User content never translated                                                                          | REQ-I18N-003                | `src/content/picker/panel.test.ts`, `src/entrypoints/options/UserContent.test.tsx`, `src/entrypoints/popup/App.test.tsx` | ✅     |
| T-147 | Visual baselines (all effects, UI light/dark/forced colors) in the Playwright container                | REQ-THEME-001, REQ-A11Y-007 | `tests/e2e/visual-baselines.spec.ts`                                                                                     | ✅     |
| T-148 | axe e2e, light + dark                                                                                  | REQ-A11Y-004                | `tests/e2e/a11y.spec.ts`                                                                                                 | ✅     |
| T-149 | 200 % zoom + 320 px reflow                                                                             | REQ-A11Y-012                | `tests/e2e/a11y.spec.ts`                                                                                                 | ✅     |
| T-150 | Performance probes (no-match < 2 ms, 500 patterns < 1 ms, scroll < 1 ms/frame, marks ≤ 100 ms)         | REQ-NFR-003                 | `tests/e2e/perf.spec.ts`                                                                                                 | ✅     |
| T-151 | Firefox manual smoke + fixes                                                                           | REQ-NFR-001                 | checklist                                                                                                                | ☐      |
| T-158 | In-app language override: `settings.language`, `setLanguage` command, runtime catalogs, EN / NL switch | REQ-I18N-006                | `src/core/commands/settings.test.ts`, `src/lib/i18n/browser-source.test.ts`, `src/entrypoints/options/Settings.test.tsx` | ✅     |

## M8 — Release v1.0 (Chrome / Edge / Firefox)

| Task  | Description                                                                                                                                                                   | REQs                      | Tests                                                                       | Status |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | --------------------------------------------------------------------------- | ------ |
| T-152 | `PRIVACY.md` final review (drafted in website T-213, D-249), store listings (en/nl) with website URLs, permission justifications, screenshots, promo tile, `SOURCE_REVIEW.md` | REQ-PRIV-007, REQ-NFR-006 | review                                                                      | ✅     |
| T-153 | `release.yml`: zips, provenance + SHA256SUMS, zip manifest assertions, `wxt submit` in env `store`                                                                            | REQ-SEC-008, REQ-NFR-006  | `tests/unit/release-workflow.test.ts`, `scripts/check-release-zips.test.ts` | ✅     |
| T-154 | Changesets release → v1.0.0, store submissions                                                                                                                                | REQ-NFR-006               | release checklist                                                           | ☐      |

## M9 — Safari v1.1

| Task  | Description                                                                      | REQs        | Tests             | Status |
| ----- | -------------------------------------------------------------------------------- | ----------- | ----------------- | ------ |
| T-155 | Safari 18 build + packaging (App Store Connect packager or Xcode `--macos-only`) | REQ-NFR-001 | checklist         | ☐      |
| T-156 | Safari fixes: grants in Safari UI, registration persistence, favicon best-effort | REQ-NFR-001 | checklist         | ☐      |
| T-157 | App Store listing + submission                                                   | REQ-NFR-006 | release checklist | ☐      |

## M10 — Scrapbook redesign (D-289)

> The owner chose the **Kraft & Coral** scrapbook look on 2026-10-17. Ship it after the v1.0 store release (T-154) unless the
> owner pulls it forward. Order: tokens and fonts first, then components, screens, logo, website, and the baselines last.

| Task  | Description                                                                                                                                                                                                                                                     | REQs                         | Tests                                                                                                                                                        | Status |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| T-159 | Decision D-289 and the design docs: `design.md` (principles, logo, color, elevation, components, theming) and `website/design.md`                                                                                                                               | —                            | —                                                                                                                                                            | ✅     |
| T-160 | Scrapbook tokens in `tokens.css`: light (Kraft & Coral), dark (plum board), forced colors; `lift` / `well` / `pressed` and tape tokens; contrast test follows the D-289 table                                                                                   | REQ-THEME-001, REQ-A11Y-007  | `tests/unit/contrast.test.ts`                                                                                                                                | ✅     |
| T-161 | Local fonts: Caveat Brush and Patrick Hand (OFL) as bundled `woff2` for the extension pages and the website, `font-display: swap`, licences listed, no remote font URL                                                                                          | REQ-WEB-003                  | `tests/build/*.test.ts`, `website/tests/build/output.test.ts`                                                                                                | ✅     |
| T-162 | Primitives and components restyled to the paper look (Button, Switch, Card, Field, Segmented, Slider, ColorField, Dialog, Toast); decoration is `aria-hidden`                                                                                                   | REQ-A11Y-007, REQ-A11Y-008   | `src/ui/components/*.test.tsx`                                                                                                                               | ✅     |
| T-163 | Popup, options page and picker panel: board background, torn-edge popup header, taped cards; tilt only on titles and cards and off under reduced motion                                                                                                         | REQ-THEME-001                | `src/entrypoints/*/*.test.tsx`                                                                                                                               | ✅     |
| T-164 | Logo: torn ribbon master, 32 / 16 px, mono, hand-lettered wordmark (light and dark), `pnpm icons`, store tiles, promo and social previews                                                                                                                       | —                            | `pnpm icons`, `tests/unit/logo.test.ts`                                                                                                                      | ✅     |
| T-165 | Website: notebook-page home with taped cards, shell, prose pages, playground frame in the paper look                                                                                                                                                            | REQ-WEBUX-001                | `website/tests/unit/scrapbook-site.test.ts`, `website/src/components/Shell.test.tsx`                                                                         | ✅     |
| T-166 | Visual baselines and screenshots regenerated in the Playwright container (UI light / dark / forced colors, website, store images); axe light and dark                                                                                                           | REQ-A11Y-004, REQ-A11Y-007   | `tests/e2e/visual-baselines.spec.ts`, `tests/e2e/a11y.spec.ts`                                                                                               | ✅     |
| T-167 | Closer to the Kraft & Coral concept: larger type, 62 × 34 switch, ruled segmented control, striped tape on sheets and frames, header inside the notebook sheet, full-note wordmark with highlighter, highlighted hero word, hero example shop = screenshot page | REQ-THEME-001, REQ-WEBUX-001 | `tests/unit/scrapbook-components.test.ts`, `tests/unit/logo.test.ts`, `website/tests/unit/screenshot-page.test.ts`                                           | ✅     |
| T-168 | Midnight Plum dark theme (D-290), language switch and GitHub link in the segmented style, ruled paper on every sheet                                                                                                                                            | REQ-THEME-001, REQ-WEBUX-001 | `tests/unit/scrapbook-screens.test.ts`, `tests/unit/logo.test.ts`, `website/tests/unit/scrapbook-site.test.ts`, `website/tests/unit/screenshot-page.test.ts` | ☐      |
