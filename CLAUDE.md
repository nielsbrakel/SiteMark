# SiteMark — notes for AI assistants

Cross-browser (Chromium/Firefox/Safari) MV3 extension built with WXT + React + TypeScript.
Read `docs/spec.md` (requirements), `docs/plan.md` (architecture) and `docs/tasks.md` (what's next)
before changing code.

## Ground rules

- **Don't start implementation tasks unless the owner explicitly asks.** Doc and scaffold fixes are fine.
- Work strictly in TDD rounds per `docs/testing.md#tdd-protocol`: a `test(T-xxx): red` commit, then
  `feat(T-xxx): green`, then `refactor(T-xxx): …`. Tick 🔴/🟢/🔵 in `docs/tasks.md` in the same commit.
- Tests name the REQ IDs they cover (`describe('REQ-URL-001 …')`).
- Layering: `src/core` is pure (no `browser.*`, no DOM globals except in `selector.ts`) ← `src/platform`
  ← `src/content` / `src/ui` ← `src/entrypoints`.
- Privacy is a feature: never add `host_permissions`, static `content_scripts`, network calls,
  remote fonts/scripts, or `storage.sync`.
- Content scripts are plain TS (no React). User text goes in via `textContent` only.
- Colors come from `src/styles/tokens.css`. Strings come from `public/_locales/{en,nl}` (keep them in sync).

## Commands

`pnpm test` · `pnpm test:e2e` (set `PW_CHROMIUM_EXECUTABLE` to use a preinstalled Chromium) ·
`pnpm check` · `pnpm progress` · `pnpm build[:firefox|:safari]` · `pnpm icons` (after logo SVG changes)
