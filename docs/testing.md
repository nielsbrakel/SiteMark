# SiteMark — Testing & TDD workflow

## Commands

| Command              | What it does                                                                  |
| -------------------- | ----------------------------------------------------------------------------- |
| `pnpm test`          | Unit + component tests (Vitest, happy-dom)                                    |
| `pnpm test:watch`    | The same in watch mode. Keep it running during TDD                            |
| `pnpm test:coverage` | With v8 coverage (`coverage/index.html`)                                      |
| `pnpm test:e2e`      | Builds the Chromium extension and runs Playwright against it                  |
| `pnpm check`         | typecheck + lint + format check + unit tests + traceability (`--strict`)      |
| `pnpm progress`      | Task progress per milestone and requirement coverage (`--verbose` lists gaps) |

First-time Playwright setup: `pnpm exec playwright install chromium`.
To use an existing Chromium instead, set `PW_CHROMIUM_EXECUTABLE=/path/to/chrome`.

## TDD protocol

Every task row in [tasks.md](tasks.md) is one red → green → refactor cycle.

### 🔴 Red

1. Read the task's requirement(s) in [spec.md](spec.md). The acceptance criteria are the test cases.
2. Write the test(s) at the path in the task's _Tests_ column, named after the REQ:

   ```ts
   describe('REQ-URL-001 wildcard matching', () => {
     it.each(table)('%s vs %s → %s', (pattern, url, expected) => { … });
   });
   ```

3. Run them and confirm they **fail for the right reason** (an assertion failure or a missing export,
   not a typo or a broken setup).
4. Commit only the test (+ the tasks.md tick):
   `test(T-010): red — wildcard host and path matching`

### 🟢 Green

1. Write the **simplest** production code that makes the tests pass. No extra features.
2. Run `pnpm test`. Everything passes, including earlier tests.
3. Commit: `feat(T-010): green — wildcard host and path matching`

### 🔵 Refactor

1. Improve names, remove duplication, extract helpers, add types. Behavior doesn't change.
2. `pnpm check` passes (and `pnpm test:e2e` if the task touches e2e).
3. Commit: `refactor(T-010): compile patterns once` (or tick 🔵 with no code change if nothing needed refactoring).

### Rules

- Never write production code without a failing test that needs it (setup chores are the exception).
- One behavior per red. Split big tasks into several red/green rounds in the same row.
- Bugs start with a failing test that reproduces them (`test(bug): red — …`).
- Tests mention REQ IDs so `pnpm progress` can trace requirement → test.
- Keep the tests fast: unit tests < 10 ms each. No real timers (`vi.useFakeTimers()`), no network.

## Test layers

See [plan.md §6](plan.md#6-test-strategy). In short:

- `src/core/**`: pure, table-driven unit tests. Coverage ≥ 90 %.
- `src/platform/**`, background, content: integration tests with `fakeBrowser` from
  `wxt/testing/fake-browser` (it's reset after every test in `tests/unit/setup.ts`).
- React UI: React Testing Library. Query by role and label, never by class name.
  `@/lib/i18n` is mocked to return keys.
- E2E: `tests/e2e/*.spec.ts` with the `test`/`expect` from `tests/e2e/fixtures.ts`, which
  launch Chromium with the built extension and expose `extensionId`.

## Manual smoke checklist (Firefox + Safari, per release)

Build: `pnpm build:firefox` → `about:debugging` → _Load Temporary Add-on_ →
`.output/firefox-mv3/manifest.json`. Safari: `pnpm build:safari`, then on macOS run
`xcrun safari-web-extension-converter .output/safari-mv3 --app-name SiteMark --bundle-identifier dev.sitemark.SiteMark --no-open`,
build in Xcode, and enable it in Safari → Settings → Extensions (allow unsigned extensions in the Develop menu).

| #   | Step                                                                         | Firefox | Safari |
| --- | ---------------------------------------------------------------------------- | ------- | ------ |
| 1   | Install: no host-permission warning                                          | ☐       | ☐      |
| 2   | Popup on a new site: "Mark this site" → permission prompt → ribbon appears   | ☐       | ☐      |
| 3   | Reload: ribbon still there, with no prompt                                   | ☐       | ☐      |
| 4   | Pick element (button + Alt+Shift+M) → save → outline follows while scrolling | ☐       | ☐      |
| 5   | SPA navigation (pushState) updates marks                                     | ☐       | ☐      |
| 6   | Hide on tab → marks gone → reload → back                                     | ☐       | ☐      |
| 7   | Options: edit color → open tab updates live                                  | ☐       | ☐      |
| 8   | Export → Reset → Import (merge) → one permission prompt → marks back         | ☐       | ☐      |
| 9   | Remove profile → revoke prompt → permission removed                          | ☐       | ☐      |
| 10  | Dark mode (OS) → popup/options/picker panel follow it                        | ☐       | ☐      |
| 11  | Browser language set to Dutch → UI in Dutch                                  | ☐       | ☐      |
| 12  | Title prefix + favicon applied, then restored after disabling                | ☐       | ☐      |
