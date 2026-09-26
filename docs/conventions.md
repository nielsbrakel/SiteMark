# SiteMark — Code conventions

> Decisions: D-202 (naming), D-222 (layers), D-225 (errors), D-235 (conventions), D-236 (CSS), D-243 (Biome).
> Lint enforcement (Biome, D-243) for most rules arrives with T-011, T-012 and T-025. Until then, review enforces them.

## Layers (D-222)

`core ← app ← platform | shared | content | ui ← entrypoints`. See [plan.md §2](plan.md#2-source-layout-and-layering-d-222).

- `core` is **pure**: no `browser.*`, no DOM, no timers or randomness (inject `Clock` and `IdGen`).
- `app` holds use cases and **ports** (interfaces). `platform` implements the ports with `browser.*`.
- `content` and `ui` never import each other. Shared DOM code lives in `shared`.
- `entrypoints` are composition roots only: wire things together, no logic.
- **Explicit imports.** WXT auto-imports are not used; import `browser` from `wxt/browser` and so on.

## Files and exports

| Rule                   | Detail                                                                          |
| ---------------------- | ------------------------------------------------------------------------------- |
| Named exports only     | Except where WXT requires a default export (entrypoints, `defineConfig`)        |
| No barrel files        | Import from the file that defines the thing, never from an `index.ts` re-export |
| File names             | `kebab-case.ts`, `PascalCase.tsx` for React components                          |
| Tests next to the code | `foo.ts` → `foo.test.ts`. Cross-cutting tests live in `tests/`                  |
| Small units            | Files ≤ 200 lines, functions ≤ 40 lines, cognitive complexity ≤ 15              |
| Type-only imports      | `import type { SiteGroup } from '…'`                                            |

## Types and errors

- **No enums.** Use string-literal unions (`type Edge = 'top' | 'bottom'`) and `as const` objects.
- **Exhaustive switches.** Every `switch` over a union ends with `default: return assertNever(x)`.
- **`Result` in core (D-225).** Core never throws on user input; it returns `Result<T, E>` with a typed error
  code. Adapters turn rejected promises into typed errors. `errorMessageKey(code)` maps codes to i18n keys.
- **Validate at the edges.** Anything from storage, messages or imports is `unknown` until a zod schema parses it.
- **Branded IDs.** `SiteGroupId`, `MarkId` and friends are branded strings; don't cast plain strings into them.
- Prefer `readonly` data and pure functions. Mutation belongs in the background's command queue (D-220).

## Naming

- **Site group** (`SiteGroup`) everywhere: UI, docs and code. Never "profile" (D-202).
- Booleans read as questions: `isEnabled`, `hasGrant`, `canAdoptSheets`.

## UI and content scripts

- **Content scripts are plain TypeScript** (no React). User text goes in via `textContent` only; colors only as
  validated hex. Never `innerHTML`.
- React components use **CSS Modules** (D-236). Only tokens and base primitives are global.
- **Colors come from `src/styles/tokens.css`.** No raw color values in components.
- **Every string is translated.** Add each key to `public/_locales/en` **and** `nl`; the locale test fails otherwise.
- Accessible by default: real buttons and labels, visible focus, never color as the only cue.

## Privacy and security

- No `host_permissions`, static `content_scripts`, web-accessible resources, network calls, remote fonts or
  scripts, `eval` / `new Function`, or `storage.sync`.
- Only the background handles requests on `runtime.onMessage` and writes storage. Other contexts send commands or
  intents; content scripts listen only for the background's pushes (`platform/listen-in-tab.ts`).
- Treat every page and every content script as hostile ([SECURITY.md](../SECURITY.md)).

## Commits

See [testing.md](testing.md#tdd-protocol) and [CONTRIBUTING.md](../CONTRIBUTING.md#workflow):
`test(T-xxx): red — …` → `feat(T-xxx): green — …` → `refactor(T-xxx): …`, plus `fix(bug)`, `chore`, `docs`.
Every commit must stand on its own, because pull requests are rebase-merged (D-209).
