<p align="center">
  <img src="design/logo/sitemark-wordmark.svg" alt="SiteMark" width="360">
</p>

<p align="center">
  <b>Never confuse production with test again.</b><br>
  A private, cross-browser extension that marks the websites you choose with ribbons, banners,
  outlines, stripes and more.<br>
  <a href="https://nielsbrakel.github.io/SiteMark/"><b>Website</b></a> ·
  <a href="https://nielsbrakel.github.io/SiteMark/privacy/">Privacy</a> ·
  <a href="https://nielsbrakel.github.io/SiteMark/support/">Support</a>
</p>

<p align="center">
  <a href="https://github.com/nielsbrakel/SiteMark/actions/workflows/ci.yml"><img src="https://github.com/nielsbrakel/SiteMark/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/nielsbrakel/SiteMark" alt="MIT license"></a>
  <img src="https://img.shields.io/badge/manifest-v3-1f6feb" alt="Manifest V3">
  <img src="https://img.shields.io/badge/browsers-Chrome%20%C2%B7%20Edge%20%C2%B7%20Firefox%20%C2%B7%20Safari-57606a" alt="Chrome, Edge, Firefox, Safari">
</p>

---

> **Status:** 🚧 Foundation (M0) is done and the plan has been reviewed ([review](docs/reviews/2026-09-25-plan-review.md)).
> Next: M0.5 hardening, then M1. Run `pnpm progress` or see [docs/tasks.md](docs/tasks.md).

## Why

Test, acceptance and production environments look the same. SiteMark lets you add
URL patterns (`https://*.example.com/*`) to a **site group** and puts a distinct marker on matching pages,
either on the whole page or on one element you pick (a logo, a header, that scary "Delete" button).

- 🎀 **Marks:** corner ribbons, banners, viewport frames, outlines, tints, hazard stripes,
  watermarks, `[PROD]` tab-title prefix and a favicon dot
- 🎯 **Picker:** hover and click any element, with an auto-generated stable CSS selector you can edit
- 🔒 **Private:** no install-time site access, no network requests, data stays in local storage.
  Move it between devices with JSON import/export
- 🌗 **Soft UI:** a neumorphic popup and options page in light and dark, English and Dutch
- 🧭 **Everywhere:** Chrome, Edge and Firefox in v1.0, Safari in v1.1 (Manifest V3)
- 🎨 **Colorblind-safe:** preset colors stay distinguishable, and marks always carry text

## Documentation

For users: the **[SiteMark website](https://nielsbrakel.github.io/SiteMark/)** explains the extension, and it
publishes the [privacy policy](PRIVACY.md) and the support routes.

| Doc                                            | What                                                      |
| ---------------------------------------------- | --------------------------------------------------------- |
| [docs/spec.md](docs/spec.md)                   | Product specification with requirement IDs                |
| [docs/plan.md](docs/plan.md)                   | Architecture, test strategy, milestones                   |
| [docs/tasks.md](docs/tasks.md)                 | TDD task list: the progress tracker                       |
| [docs/design.md](docs/design.md)               | Design system, screens, marker specs, logo                |
| [docs/decisions.md](docs/decisions.md)         | Decision log                                              |
| [docs/testing.md](docs/testing.md)             | How to test, the TDD protocol, manual smoke checklist     |
| [docs/conventions.md](docs/conventions.md)     | Code conventions and layering rules                       |
| [docs/repo-setup.md](docs/repo-setup.md)       | GitHub repository setup and store publishing              |
| [docs/reviews/](docs/reviews/)                 | Specialist plan reviews and what happened to each finding |
| [docs/website/](docs/website/spec.md)          | The website: spec, plan, design and tasks                 |
| [docs/store-listing.md](docs/store-listing.md) | Store listing fields and their website URLs               |

## Development

```bash
corepack enable && pnpm install
pnpm dev            # Chromium + HMR   (pnpm dev:firefox for Firefox)
pnpm test:watch     # unit/component tests (TDD loop)
pnpm test:e2e       # Playwright against the built extension
pnpm check          # everything CI checks except e2e
pnpm format         # Biome (code, JSON, CSS) + Prettier (Markdown, YAML)
pnpm progress       # progress + requirement traceability
```

Stack: [WXT](https://wxt.dev) · React 19 · TypeScript · Vitest · Testing Library · Playwright · Biome · pnpm.

## Contributing

Contributions are welcome! Read [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow (strict TDD, rebase-merged
PRs, changesets) and follow the [Code of Conduct](CODE_OF_CONDUCT.md). Questions and help: [SUPPORT.md](.github/SUPPORT.md).

## Security

Please report vulnerabilities privately, as described in [SECURITY.md](SECURITY.md). It also documents the
threat model: SiteMark prevents _accidental_ confusion and is not a security control.

## License

[MIT](LICENSE)
