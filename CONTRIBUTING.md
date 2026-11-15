# Contributing to SiteMark

Thanks for helping. SiteMark is a small browser extension that puts privacy first, so we are strict about new
permissions, dependencies and network access. Everything else is welcome.

## Before you start

- **Bugs:** open an issue with the [bug form](https://github.com/nielsbrakel/SiteMark/issues/new?template=bug_report.yml).
  Security problems go through [SECURITY.md](SECURITY.md), never a public issue.
- **Features:** open a [feature request](https://github.com/nielsbrakel/SiteMark/issues/new?template=feature_request.yml)
  first. The non-goals and privacy rules in [docs/spec.md](docs/spec.md) are deliberate.
- **Planned work:** [docs/tasks.md](docs/tasks.md) lists it. Look for issues labelled `good first issue`, and
  comment on an issue before you start something big.

Read [docs/plan.md](docs/plan.md) for the architecture before you change code. The reasons behind past choices are
in [docs/decisions.md](docs/decisions.md). By taking part you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).

## Setup

You need Node 26 (see `.nvmrc`) and pnpm through Corepack. On an older Node, `pnpm install` stops with `ERR_PNPM_UNSUPPORTED_ENGINE`.

```bash
corepack enable && pnpm install
pnpm dev                                # Chromium with the extension loaded + HMR
pnpm dev:firefox                        # the same for Firefox
pnpm exec playwright install chromium   # once, for e2e tests (or set PW_CHROMIUM_EXECUTABLE)
```

## Workflow

1. Branch from `main`.
2. Work in **strict TDD** ([protocol](docs/testing.md#tdd-protocol)):
   - `test(T-xxx): red — …`: failing tests and typed stubs. Typecheck and lint still pass.
   - `feat(T-xxx): green — …`: the least code that makes them pass.
   - `refactor(T-xxx): …`: optional cleanup. The tests stay green.
   - Top-level `describe` names start with the requirement ID, for example `describe('REQ-URL-001 …')`.
   - Bug fixes: `test(bug): red — …`, then `fix(bug): green — …`. Docs: `docs: …`. Tooling: `chore: …`.
3. Follow the [code conventions](docs/conventions.md).
4. For a change users will notice, add a line under "Unreleased" in `CHANGELOG.md`, in the user's words.
5. Run `pnpm check`. Also run `pnpm test:e2e` if you changed marks, the picker, the popup or the options page.
6. Open a pull request and fill in the template.

Pull requests are **rebase-merged**. Every commit lands on `main` as it is, so each one must make sense on
its own. Clean up your history before you ask for review.

## Hard rules

Review checks these rules, and lint and CI check most of them too:

- No `host_permissions`, static `content_scripts`, web-accessible resources, network calls, remote fonts or
  scripts, `eval` / `new Function`, or `storage.sync`.
- The background is the only storage writer. Content scripts are untrusted and only receive their render plan.
- User text goes into pages via `textContent` only; colors only as validated hex.
- Colors come from `src/styles/tokens.css`. Every UI string lives in `public/_locales/en` **and** `nl`.
- Terminology: **site group**, never "profile".

## Translations

Strings live in `public/_locales/<lang>/messages.json`. A test keeps the locales in sync, so add every new key to every language. To add a language, open an issue first.

## License

By contributing you accept the contribution terms in the [LICENSE](LICENSE). You keep your name on the commit. The copyright holder may use and relicense your contribution.
