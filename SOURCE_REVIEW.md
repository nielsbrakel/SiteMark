# Building SiteMark from source (for add-on reviewers)

These steps rebuild the Firefox package from this sources zip. The result matches the submitted
`sitemark-<version>-firefox.zip` file for file (REQ-SEC-008).

## Requirements

- Linux, macOS or Windows (WSL); the release is built on Ubuntu 24.04.
- **Node.js 22.22.2** (the exact version is in `.nvmrc`).
- **pnpm 10.33.0** (the exact version is in the `packageManager` field of `package.json`). With Node's Corepack,
  `corepack enable` picks it up automatically.

No other tools, services or network access beyond the npm registry are needed. The build downloads nothing at
build time and runs no code generators beyond WXT's own.

## Build

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm zip:firefox
```

`pnpm install --frozen-lockfile` installs exactly the versions in `pnpm-lock.yaml`. `pnpm zip:firefox` runs
`wxt zip -b firefox`, which writes:

- `.output/firefox-mv3/`: the unpacked extension;
- `.output/sitemark-<version>-firefox.zip`: the package that was submitted.

To compare only the unpacked extension, `pnpm build:firefox` is enough.

## What is in the package

- The source code is TypeScript in `src/` (plus React for the popup and options page), bundled by WXT (Vite).
  Nothing is obfuscated; the bundles are minified.
- There is **no remote code**: no `eval`, no `new Function`, no scripts or fonts from other hosts, and no network
  requests of the extension's own (`tests/build/output-scan.test.ts` checks the built output).
- The manifest asks for `storage`, `scripting` and `activeTab` only. Access to websites is optional and asked
  for per website at runtime (see `PRIVACY.md`).
- The only third-party runtime code is React, zod and `@eslint-community/regexpp` (the regex parser behind the
  URL pattern safety checks), all in `dependencies` in `package.json`; everything else is development tooling.

## Tests (optional)

`pnpm test` runs the unit and component tests; `pnpm test:build` builds every target and checks the manifests
and the output. See `docs/testing.md`.
