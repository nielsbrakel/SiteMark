# SiteMark — notes for AI assistants

Cross-browser MV3 extension (Chromium + Firefox in v1.0, Safari in v1.1) built with WXT + React + TypeScript.
Read `docs/spec.md` (requirements), `docs/plan.md` (architecture), `docs/decisions.md` (D-xxx) and
`docs/tasks.md` (what's next) before changing code.

## Ground rules

- **Don't start implementation tasks unless the owner explicitly asks.** Doc and scaffold fixes are fine.
- Strict TDD per `docs/testing.md#tdd-protocol`: `test(T-xxx): red` (tests + typed stubs; typecheck and lint pass)
  → `feat(T-xxx): green` → optional `refactor(T-xxx)`. Top-level `describe` names start with the REQ ID.
  PRs are rebase-merged, so every commit must stand on its own.
- Terminology: **site group** (`SiteGroup`) everywhere. Never "profile".
- Layering (D-222): `core ← app ← platform | shared | content | ui ← entrypoints`. `core` is pure
  (no `browser.*`, no DOM). `content` and `ui` never import each other. Use explicit imports (no WXT auto-imports).
- The background is the **only storage writer** (D-220). Other contexts send commands or intents. Content
  scripts are untrusted and only receive their render plan (D-221, D-239).
- Privacy is a feature: never add `host_permissions`, static `content_scripts`, web-accessible resources,
  network calls, remote fonts or scripts, `eval`/`new Function`, or `storage.sync`.
- Content scripts are plain TS (no React). User text goes in via `textContent` only; colors only as validated hex.
- Colors come from `src/styles/tokens.css`, and strings from `public/_locales/{en,nl}` (keep both in sync).
- Conventions (D-235): named exports, no barrels, small files and functions, `Result` in core, exhaustive switches.
- Lint and format with **Biome** (D-243), not ESLint; Prettier only formats Markdown and YAML. Suppress a rule with
  `// biome-ignore lint/<group>/<rule>: <reason>`.

## Commands

`pnpm test` · `pnpm lint` · `pnpm format` · `pnpm test:e2e` (set `PW_CHROMIUM_EXECUTABLE` to use a preinstalled Chromium) ·
`pnpm check` · `pnpm progress` · `pnpm build[:firefox|:safari]` · `pnpm icons` (after logo SVG changes)
