<p align="center">
  <img src="design/logo/sitemark-wordmark.svg" alt="SiteMark" width="360">
</p>

<p align="center">
  <b>Never confuse production with test again.</b><br>
  A private, cross-browser extension that marks the websites you choose with ribbons, banners,
  outlines, stripes and more.
</p>

---

> **Status:** 🚧 Foundation (M0) is done: spec, plan, design and scaffold. Implementation starts with M1.
> Run `pnpm progress` or see [docs/tasks.md](docs/tasks.md).

## Why

Test, acceptance and production environments look the same. SiteMark lets you add
URL patterns (`https://*.example.com/*`) and puts a distinct marker on matching pages, either
on the whole page or on one element you pick (a logo, a header, that scary "Delete" button).

- 🎀 **Marks:** corner ribbons, banners, viewport frames, outlines, tints, hazard stripes,
  watermarks, `[PROD]` tab-title prefix and a favicon dot
- 🎯 **Picker:** hover and click any element, with an auto-generated stable CSS selector you can edit
- 🔒 **Private:** no install-time site access, no network requests, data stays in local storage.
  Move it between devices with JSON import/export
- 🌗 **Soft UI:** a neumorphic popup and options page in light and dark, English and Dutch
- 🧭 **Everywhere:** Chrome, Edge, Brave, Opera, Firefox and Safari (Manifest V3)

## Documentation

| Doc                                      | What                                                  |
| ---------------------------------------- | ----------------------------------------------------- |
| [docs/spec.md](docs/spec.md)             | Product specification with requirement IDs            |
| [docs/plan.md](docs/plan.md)             | Architecture, test strategy, milestones               |
| [docs/tasks.md](docs/tasks.md)           | TDD task list: the progress tracker                   |
| [docs/design.md](docs/design.md)         | Design system, screens, marker specs, logo            |
| [docs/decisions.md](docs/decisions.md)   | Decision log                                          |
| [docs/testing.md](docs/testing.md)       | How to test, the TDD protocol, manual smoke checklist |
| [docs/repo-setup.md](docs/repo-setup.md) | GitHub repository setup and store publishing          |

## Development

```bash
corepack enable && pnpm install
pnpm dev            # Chromium + HMR   (pnpm dev:firefox for Firefox)
pnpm test:watch     # unit/component tests (TDD loop)
pnpm test:e2e       # Playwright against the built extension
pnpm check          # everything CI checks except e2e
pnpm progress       # progress + requirement traceability
```

Stack: [WXT](https://wxt.dev) · React 19 · TypeScript · Vitest · Testing Library · Playwright · pnpm.

## License

[MIT](LICENSE)
