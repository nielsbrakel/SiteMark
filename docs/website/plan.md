# SiteMark website — Technical plan

> Implements [spec.md](spec.md) (rev 1). Work items live in [tasks.md](tasks.md), and the process in
> [testing.md](../testing.md) (the same TDD protocol). Decisions are referenced as D-xxx ([decisions.md](../decisions.md)).

## 1. Stack

| Concern         | Choice                                                                                                           | Ref          |
| --------------- | ---------------------------------------------------------------------------------------------------------------- | ------------ |
| Build           | Vite 8 (the same major as WXT), a client build + an SSR build, and a small prerender script (no SSG framework)   | D-245        |
| UI              | React 19 + TypeScript, CSS Modules. `renderToString` at build time, `hydrateRoot` per page in the browser        | D-245, D-236 |
| Markdown        | `react-markdown` + `remark-gfm` (renders to React elements; raw HTML off), `gray-matter`-style front matter      | REQ-WEB-006  |
| i18n            | The shared translator (`src/lib/i18n/translate.ts`) + a catalog `MessageSource`                                  | D-247        |
| Marks           | `src/core/render/compose.ts` + `src/shared/marker-view` + the mock-browser preview from `src/ui/components`      | D-254        |
| Tests           | Vitest (node + happy-dom projects), RTL + vitest-axe, Vitest browser mode, Playwright (+ `@axe-core/playwright`) | D-233        |
| Quality         | The root TS strict config, Biome (+ a `website` zone), stylelint, knip, Prettier for Markdown                    | D-243        |
| Hosting         | GitHub Pages (project site, base `/SiteMark/`), deployed by `actions/deploy-pages`                               | D-244, D-252 |
| Package manager | A pnpm workspace package `website` (private, never published)                                                    | D-244        |

As in the extension, a library is added by the task that first needs it, never ahead of time.

## 2. Source layout

```text
website/
├─ package.json          private workspace package "@sitemark/website"
├─ vite.config.ts        base '/SiteMark/', client + SSR builds, aliases to ../src
├─ index.html            HTML template (head slots filled by the prerender step)
├─ locales/{en,nl}/messages.json          website strings (chrome.i18n format)
├─ content/{en,nl}/help/*.md              help topics (W2), front matter: title, description, order
├─ public/               copied as-is: social-preview.png, generated screenshots, favicon PNGs
├─ scripts/
│  ├─ prerender.ts       routes × locales → dist/**/index.html, 404.html, sitemap.xml
│  └─ screenshots.ts     Playwright on the extension e2e build → public/screenshots (W2)
├─ src/
│  ├─ routes/            routes.ts (PURE route table: slug, page, milestone, stable, nav) · urls.ts
│  ├─ head/              seo.ts · csp.ts · json-ld.ts · sitemap.ts (pure builders, return data, not HTML strings)
│  ├─ i18n/              catalog-source.ts (MessageSource over the merged catalogs) · website-t.ts
│  ├─ content/           markdown.tsx (react-markdown config) · policy.ts · help.ts · changelog.ts (build-time loaders)
│  ├─ theme/             bootstrap.ts (inline, hash-pinned) · ThemeToggle.tsx
│  ├─ components/        Shell · Header · Footer · LanguageSwitch · InstallButtons · Prose · Hero · …
│  ├─ pages/             HomePage · PrivacyPage · SupportPage · HelpPage · ChangelogPage · PlaygroundPage · NotFoundPage
│  ├─ playground/        playground-state.ts (pure reducer) · Playground.tsx · PresetPicker.tsx (W2)
│  ├─ config/stores.ts   store listing URLs (or null = coming soon)
│  ├─ styles/            website-tokens.css (layout + type sizes; no colors) · prose.css
│  ├─ entry-server.tsx   render(route, locale) → { html, head }
│  └─ entry-client.tsx   reads <html data-route> and hydrates that page
└─ tests/
   ├─ build/             assertions on dist/ (prerender, output scan, budgets, links)
   └─ e2e/               Playwright against `vite preview` at /SiteMark/
```

The extension's `src/lib/i18n.ts` becomes `src/lib/i18n/translate.ts` (pure `createTranslator(source)` with
`t`/`tp`) + `src/lib/i18n/browser-source.ts` (the `browser.i18n` adapter). This is done in T-024 (D-247).

### 2.1 Layering (D-246)

```text
core ← app ← platform | shared | content | ui ← entrypoints      (extension, D-222)
core ← shared ← ui ← website                                      (website)
```

- `website` **may import**: `src/core/**`, `src/shared/**`, presentational `src/ui/components/**`,
  `src/lib/i18n/translate.ts`, `src/styles/*.css`, and `public/_locales/*/messages.json` (as JSON).
- `website` **never imports**: `src/app`, `src/platform`, `src/content`, `src/entrypoints`,
  `src/lib/i18n/browser-source.ts`, `src/ui/hooks` that touch `browser.*`, or `wxt/*`.
- Nothing under `src/` imports `website/`.
- This is enforced by a Biome `noRestrictedImports` override for `website/**` plus lint fixture tests (T-202). Because
  `src/ui/components` is now shared with a web page, a component there may not call `browser.*` directly. It gets
  data and callbacks through props (the extension's containers live in `entrypoints`/`ui/hooks`).

## 3. Build & prerender pipeline (D-245)

```text
vite build                      → dist/client/  (hashed JS/CSS per page, no inline scripts)
vite build --ssr entry-server   → dist/server/entry-server.js
tsx scripts/prerender.ts
   for route in routes(milestone ≤ current) × locale in [en, nl]:
       { html, head } = render(route, locale)          ← renderToString + head builders (seo, csp, json-ld)
       write dist/client/<base>/<locale-prefix><slug>/index.html
           <html lang data-route data-locale data-theme-bootstrap>
           <meta CSP with sha256(bootstrap)> <link rel=canonical/alternate> <script type=module src=/SiteMark/assets/page-*.js>
   write 404.html (bilingual), sitemap.xml
→ dist/client is the Pages artifact
```

- **Hydration without a router:** each page is a normal link to a normal HTML file. `entry-client.tsx` reads
  `document.documentElement.dataset.route` and hydrates only that page component, with the same locale catalog
  that the server used (serialized as a static JSON asset per locale, not inline).
- **Build-time content:** the policy, help and changelog Markdown is read by the SSR build and becomes part
  of the rendered React tree. The client bundle imports the same Markdown modules through Vite's `?raw`
  import, so hydration matches. W2 may split help content per page to stay within budget.
- **Only one inline script:** the theme bootstrap (≈ 300 bytes, reads `localStorage`, sets `data-theme` before
  paint). Its SHA-256 is computed at build time and put into the CSP. There are no other inline scripts or styles.
- **Head data** is built by pure functions (`seo.ts`, `csp.ts`, `json-ld.ts`) that return plain data. One
  renderer turns that data into tags with escaping, so there is no string concatenation of HTML anywhere.

## 4. i18n (D-247)

```ts
// src/lib/i18n/translate.ts (pure, shared)
interface MessageSource { get(key: string, substitutions: readonly string[]): string | undefined; locale: Locale }
createTranslator(source) → { t(key, subs?), tp(key, count, subs?) }   // throws on unknown keys in dev/test

// extension: src/lib/i18n/browser-source.ts → browser.i18n.getMessage + getUILanguage
// website:   website/src/i18n/catalog-source.ts → merged JSON catalogs for the route's locale
```

- **Catalogs:** `website/locales/{en,nl}/messages.json` holds the website strings (the `website*` key prefix).
  The website catalog = the website locales + the keys from `public/_locales` that reused `src/ui` components need.
  A test fails on duplicate keys, on en/nl key or placeholder mismatches, and on empty messages.
- **Typed keys:** `WebsiteMessageKey` is derived from `website/locales/en/messages.json`, like `MessageKey` (T-024).
- **`$PLACEHOLDER$` substitution and plurals** use exactly the same code as in the extension (`Intl.PluralRules`, `_one`/`_other`).
- **Locale per route:** it comes from the URL prefix (`/nl/`), never from the browser language (D-255).

## 5. Content pipeline

| Content   | Source                                                          | Loader                  | Tests                                                              |
| --------- | --------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------ |
| Privacy   | `PRIVACY.md`, `PRIVACY.nl.md` (repository root)                 | `content/policy.ts`     | heading parity, required sections (REQ-POLICY-002), `Last updated` |
| Help      | `website/content/{en,nl}/help/*.md`                             | `content/help.ts`       | same files per locale, valid front matter, unique `order`          |
| Changelog | `CHANGELOG.md` (Changesets)                                     | `content/changelog.ts`  | renders every release heading; empty-changelog state               |
| Support   | Messages in the catalogs + URLs from `SUPPORT.md`/`SECURITY.md` | `pages/SupportPage.tsx` | links equal the URLs parsed from those files                       |

Markdown rendering (`content/markdown.tsx`) uses `react-markdown` with `skipHtml`, `remark-gfm`, and heading
anchors (`id` from a pure slugger). External links get `rel="noopener noreferrer"`. Relative links to repository
files (for example `SECURITY.md`) are rewritten to their GitHub URLs.

## 6. Security & privacy (D-250)

- **CSP by meta tag.** GitHub Pages can't set response headers, so `frame-ancestors`, `report-to` and HSTS
  preload are out of reach (accepted: the website has no state or secrets worth framing). `default-src 'none'` is the baseline.
- **Styles:** CSS files only (`style-src 'self'`). Marker-view uses `adoptedStyleSheets`, which CSP doesn't block
  (Chrome, Firefox and Safari all support constructable sheets in documents). React `style={}` props are
  banned in `website/**` and in reused components by a Biome rule, because prerendered `style` attributes need `'unsafe-inline'`.
- **No network code:** the extension's bans (`fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, `innerHTML`, `eval`) also apply to `website/**`.
- **Output scan** (T-211): no `http(s)://` in `src`/`href` of loaded resources except the website origin; external
  links only to an allowlist (github.com/nielsbrakel/SiteMark, the store domains, GitHub's privacy statement);
  no inline `<script>` except the hashed bootstrap and JSON-LD; no `style=` attributes; no `on*=` handlers.

## 7. Test strategy (same layers as D-233)

| Layer     | Tool                                    | Scope                                                                                                        | Files                              |
| --------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------- |
| Unit      | Vitest `website-node`                   | Route table, URLs, head builders (SEO, CSP, JSON-LD), sitemap, content loaders, catalogs, playground reducer | `website/src/**/*.test.ts`         |
| Component | Vitest `website-dom` + RTL + vitest-axe | Pages, shell, language switch, theme toggle, install buttons, playground controls                            | `website/src/**/*.test.tsx`        |
| Browser   | Vitest `browser` project (Chromium)     | Playground rendering with the real marker-view (layout, adopted sheets)                                      | `website/src/**/*.browser.test.ts` |
| Build     | Vitest (node) on `website/dist`         | Every route file exists, head tags, CSP hash matches, output scan, budgets, base-path links                  | `website/tests/build/*.test.ts`    |
| E2E       | Playwright against `vite preview`       | Navigation, language switch, theme persistence, no-JS, zero third-party requests, axe, zoom/reflow, visual   | `website/tests/e2e/*.spec.ts`      |

Same rules as the extension: the top-level `describe` starts with the REQ ID, red → green commits, `verify-tdd`,
fixed clocks, and no real network. Playwright tags (`@REQ-WEB-003`) count for coverage. The e2e network
listener fails on any request whose origin isn't the preview server.

## 8. CI/CD

| Workflow    | Trigger                                                                                                                                                                                                                   | Jobs                                                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ci.yml`    | PR, push `main` (existing)                                                                                                                                                                                                | **website** job: build + unit/dom/build tests + e2e (Playwright container), included in **ci-ok**                                                |
| `pages.yml` | push `main` touching `website/**`, `src/core/**`, `src/shared/**`, `src/ui/**`, `src/lib/i18n/**`, `src/styles/**`, `public/_locales/**`, `PRIVACY*.md`, `CHANGELOG.md`, `design/social-preview.png`; `workflow_dispatch` | **build** (`permissions: contents: read`) → upload Pages artifact → **deploy** in environment `github-pages` (`pages: write`, `id-token: write`) |

The usual rules apply (D-238): SHA-pinned actions, `persist-credentials: false`, timeouts, job-level permissions,
and `concurrency: pages` without cancelling a deploy in progress. The `github-pages` environment only allows `main`.
The policy date check (REQ-POLICY-004) runs in `ci.yml` on pull requests.

## 9. Milestones (D-253)

| #   | Milestone              | Outcome                                                                                                      | Depends on                                                        |
| --- | ---------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| W1  | **Website foundation** | Workspace, prerender, i18n, shell, theme, CSP, SEO, privacy, support, home (static hero), 404, deploy, links | M0.5 (T-010–T-013, T-022–T-026) and T-024 (shared translator)     |
| W2  | **Help & playground**  | Screenshots, playground (page + hero), help topics, changelog, visual baselines                              | M3 (marker-view), T-133/T-135 (presets, mock-browser preview), M6 |

W1 must finish **before T-152**, because the store listings need the privacy and support URLs. W2 starts after M6,
when the features it documents and screenshots exist. It isn't a release blocker. Each milestone ends like
the extension milestones: all tasks done, `pnpm check` + website e2e green, every Must REQ covered by a passing test.

## 10. Risks

| Risk                                                      | Mitigation                                                                                                                                  |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Hydration mismatches (server vs client output)            | The same catalogs and content modules on both sides; no `Date.now()`/random in render; a dev-mode hydration-error test in e2e               |
| Reusing `src/ui` pulls `browser.*` into a web page        | The D-246 zone, the "presentational only" rule for `src/ui/components`, and the website build fails on `wxt/browser` in the graph           |
| The React runtime grows past the JS budget                | The budget test (REQ-WEB-007), help content split per page, no client router                                                                |
| The base path is forgotten (links break only on Pages)    | Every URL comes from `urls.ts`; a build test rejects root-relative links; e2e runs under `/SiteMark/`                                       |
| Indexing is slow without Search Console or `robots.txt`   | Links from the README, GitHub About, the stores and the manifest; the sitemap is linked in the footer; Search Console is listed under Later |
| The privacy text drifts from the extension's behavior     | A single source (`PRIVACY*.md`), required-section tests, the date check, and a review in T-152                                              |
| GitHub Pages on a free plan needs a **public** repository | The repository is public already (repo-setup §1). If it ever goes private, Pages needs a paid plan                                          |
| Screenshots break as the UI changes                       | They are generated from the e2e build (D-251); visual baselines catch unintended changes                                                    |
