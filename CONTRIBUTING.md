# Contributing to SiteMark

Thanks for helping! SiteMark is a small, privacy-first browser extension, so the bar for new
permissions, dependencies and network access is high. Everything else is welcome.

## Before you start

- **Bugs:** open an issue with the [bug form](https://github.com/nielsbrakel/SiteMark/issues/new?template=bug_report.yml).
  Security problems go through [SECURITY.md](SECURITY.md), never a public issue.
- **Features:** open a [feature request](https://github.com/nielsbrakel/SiteMark/issues/new?template=feature_request.yml)
  first. Check [docs/spec.md](docs/spec.md): the non-goals (§2) and the privacy rules (§5.6) are deliberate.
- **Task list:** planned work lives in [docs/tasks.md](docs/tasks.md). Look for issues labelled
  `good first issue`, or comment on an issue before you start something big.

Please read [docs/plan.md](docs/plan.md) (architecture) and [docs/decisions.md](docs/decisions.md) (the
decision log, `D-xxx`) before changing code. By participating you agree to the
[Code of Conduct](CODE_OF_CONDUCT.md).

## Setup

You need Node 22 (see `.nvmrc`) and pnpm via Corepack.

```bash
corepack enable && pnpm install
pnpm dev                                # Chromium with the extension loaded + HMR
pnpm dev:firefox                        # the same for Firefox
pnpm exec playwright install chromium   # once, for e2e tests (or set PW_CHROMIUM_EXECUTABLE)
```

## Workflow

1. Branch from `main`.
2. Work in **strict TDD** ([docs/testing.md](docs/testing.md#tdd-protocol)):
   - `test(T-xxx): red — …`: failing tests + typed stubs. Typecheck and lint still pass.
   - `feat(T-xxx): green — …`: the minimum code to make them pass.
   - `refactor(T-xxx): …`: optional cleanup, tests stay green.
   - Top-level `describe` names start with the requirement ID, e.g. `describe('REQ-URL-001 …')`.
   - Bug fixes: `test(bug): red — …` then `fix(bug): green — …`. Docs: `docs: …`. Tooling: `chore: …`.
3. Follow the [code conventions](docs/conventions.md).
4. Add a **changeset** for user-facing changes: `pnpm changeset` ([.changeset/README.md](.changeset/README.md)).
5. Run `pnpm check` (and `pnpm test:e2e` if marker, picker, popup or options behavior changed).
6. Open a pull request and fill in the template.

Pull requests are **rebase-merged** (D-209): every commit lands on `main` as-is, so each one must make
sense on its own. Clean up your history before asking for review.

## Hard rules

These are checked in review and, increasingly, by lint and CI:

- No `host_permissions`, static `content_scripts`, web-accessible resources, network calls, remote fonts or
  scripts, `eval` / `new Function`, or `storage.sync`.
- The background is the only storage writer. Content scripts are untrusted and only receive their render plan.
- User text goes into pages via `textContent` only; colors only as validated hex.
- Colors come from `src/styles/tokens.css`. Every UI string lives in `public/_locales/en` **and** `nl`.
- Terminology: **site group**, never "profile".

## Translations

Strings live in `public/_locales/<lang>/messages.json`. A test keeps the locales in sync, so a new key must
be added to every language. Want to add a language? Open an issue first.

## License

By contributing you agree that your contributions are licensed under the [MIT License](LICENSE).
