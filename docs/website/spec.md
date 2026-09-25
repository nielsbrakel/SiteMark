# SiteMark website — Product specification (v1)

> Status: **Draft, rev 1** (owner interview 2026-09-25, D-244…D-256)
> Related: [plan](plan.md) · [design](design.md) · [tasks](tasks.md) · [decisions](../decisions.md) ·
> extension [spec](../spec.md)

## 1. Problem

SiteMark has no public home. The README is written for contributors, and nothing on the web explains the
extension to people searching for it. The stores also need stable URLs that don't exist yet: every listing
needs a **privacy policy URL**, and the App Store (v1.1) also needs a **support URL**. Without these,
T-152 and T-157 can't finish.

## 2. Vision and success

A small, fast, bilingual **website** on GitHub Pages that explains SiteMark, publishes its privacy policy,
shows how to get help and lets visitors try a mark in the browser. It is built from this repository with the
same tokens, components, i18n format, test layers and TDD process as the extension.

**Goals.**

1. **Findable:** Google indexes every page. Each page has a unique title, a description, a canonical URL and hreflang links.
2. **Trustworthy:** the privacy page _is_ `PRIVACY.md`, so the website and the repository can't drift apart.
3. **Consistent:** same design tokens, same components, the same message format as the extension.
4. **Private:** no cookies, no analytics, no third-party requests. The website practices what the extension promises.
5. **Cheap to maintain:** content comes from repository files, screenshots are generated, and deploys run automatically.

**Non-goals (v1).** Accounts, contact forms, a public email address, comments, a newsletter, a blog,
analytics of any kind, a custom domain, a cookie banner (nothing needs one), contributor docs (they stay in
the repository), and Google Search Console verification (see §8).

**Success signals (no telemetry).**

- A `site:nielsbrakel.github.io/SiteMark` search lists every route within 4 weeks of the first deploy.
- Every store listing links its privacy, support and website fields to the website.
- Zero third-party requests in every website e2e flow.
- axe shows 0 serious or critical violations on every route, in light and dark, in en and nl.

## 3. Audience

| Persona                 | Need                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------ |
| **Prospective user**    | Arrives from a search or a store listing and wants to know what SiteMark does and whether to trust it. |
| **Existing user**       | Needs help (patterns, picker, permissions), wants to see what's new, or wants to report a bug.         |
| **Store reviewer**      | Checks the privacy policy and the support route.                                                       |
| **Security researcher** | Looks for the private reporting route.                                                                 |

## 4. Glossary

| Term           | Meaning                                                                                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Website**    | This static site on GitHub Pages. In docs and code it is always "website" (folder `website/`), never "site": in SiteMark, a _site_ is a web page the user marks. |
| **Route**      | One page of the website in one language, e.g. `/nl/privacy/`. Every route is one prerendered HTML file.                                                          |
| **Playground** | The interactive demo that renders real marks on a mock browser window.                                                                                           |
| **Base path**  | `/SiteMark/`, the path prefix of a GitHub Pages project site. It is case-sensitive.                                                                              |

Extension terms (site group, mark, effect, render plan) keep their meaning from the [extension spec](../spec.md#4-glossary-the-same-terms-are-used-in-the-ui-the-docs-and-the-code).

## 5. Functional requirements

Priority: **M**ust / **C**ould. Milestones: **W1** (before the store release, T-152) and **W2** (after M6), see D-253.

### 5.1 Hosting, build & privacy — `WEB`

| ID          | P   | Requirement                                                                                                                                                                                                                                                                                                                                                                                                        |
| ----------- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| REQ-WEB-001 | M   | The website is served by GitHub Pages at `https://nielsbrakel.github.io/SiteMark/` and built from `website/` in this repository (D-244). Every internal URL carries the base path `/SiteMark/`, and a build test fails on any root-relative link that doesn't.                                                                                                                                                     |
| REQ-WEB-002 | M   | Every route is **prerendered** to static HTML at build time (React `renderToString`). Content, navigation and links work with JavaScript disabled. In the browser, React **hydrates** each page (`hydrateRoot`) for the interactive parts: theme toggle, language switch, playground (D-245). There is no client-side router.                                                                                      |
| REQ-WEB-003 | M   | **No third-party requests:** no analytics, web fonts, CDNs, embeds, iframes or trackers. System fonts only, and every asset is self-hosted. Outgoing _links_ (`<a href>`) to GitHub and the stores are allowed. E2E fails on any request that leaves the website origin (D-250).                                                                                                                                   |
| REQ-WEB-004 | M   | **No cookies.** Web storage holds only the theme choice under the key `sitemark-website:theme`. Nothing else is stored (D-250).                                                                                                                                                                                                                                                                                    |
| REQ-WEB-005 | M   | Every page declares a CSP in `<meta http-equiv="Content-Security-Policy">`: `default-src 'none'; script-src 'self' 'sha256-…'` (only the theme bootstrap hash); `style-src 'self'; img-src 'self'; connect-src 'none'; base-uri 'none'; form-action 'none'`, plus `<meta name="referrer" content="strict-origin-when-cross-origin">`. No `style` attributes appear in the HTML, so no `'unsafe-inline'` is needed. |
| REQ-WEB-006 | M   | No `dangerouslySetInnerHTML`, `innerHTML`, `eval` or `new Function` in website code or its built output. Markdown is rendered to React elements, with raw HTML disabled.                                                                                                                                                                                                                                           |
| REQ-WEB-007 | M   | **Budgets**, checked on the built output: ≤ 80 KB gzipped JS per page (React included), ≤ 30 KB gzipped HTML + CSS per page, raster images ≤ 200 KB each, and every `<img>` has `width` and `height` (no layout shift).                                                                                                                                                                                            |
| REQ-WEB-008 | M   | **Deploy** (D-252): `pages.yml` deploys on a push to `main` that changes the website or its inputs (see [plan §8](plan.md#8-cicd)), and on manual dispatch, in the environment `github-pages`. Pull requests only build and test the website.                                                                                                                                                                      |
| REQ-WEB-009 | M   | Website code passes the same gates as the extension (REQ-NFR-004): typecheck, Biome with a `website` layer zone (D-246), stylelint, format, knip, and tests with coverage ≥ 80 % lines. The website jobs are part of `ci-ok`.                                                                                                                                                                                      |

### 5.2 Pages — `PAGE`

| ID           | P   | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------ | --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-PAGE-001 | M   | **Home:** a one-sentence value proposition, three highlights matching the extension goals (unmistakable, simple, private), a hero preview (a static illustration in W1, the playground hero in W2, REQ-PLAY-004), install buttons and a privacy summary that links to the privacy page.                                                                                                                                                                                                                                                                                                               |
| REQ-PAGE-002 | M   | **Install buttons** come from one config file. A store without a listing URL yet shows a disabled "Coming soon" state, never a dead link. Chrome, Edge and Firefox are live from v1.0. Safari shows "Coming in v1.1" until M9.                                                                                                                                                                                                                                                                                                                                                                        |
| REQ-PAGE-003 | M   | **Support:** the contact routes are GitHub Issues (bug report and feature request forms) and GitHub private vulnerability reporting, with a clear "don't open a public issue for security problems" (D-248). It also has an FAQ (restricted pages, the permission prompt, marks not showing, hiding marks, where data lives, removing all data), what to include in a bug report (browser + version, SiteMark version, **Copy diagnostics** from REQ-OPT-007) and the spare-time response expectation. The links are the same URLs as in `.github/SUPPORT.md` and `SECURITY.md`, which a test checks. |
| REQ-PAGE-004 | M   | **Help** (W2): an index plus topic pages (getting started, URL patterns, marks & effects, picking an element, hiding marks & shortcuts, permissions explained, import & export, troubleshooting). They are written in Markdown in `website/content/{en,nl}/help/`, with front matter (`title`, `description`, `order`). en and nl have the same topic files.                                                                                                                                                                                                                                          |
| REQ-PAGE-005 | M   | **Changelog** (W2): rendered from `CHANGELOG.md` (Changesets) at build time. English only: the Dutch route says so in Dutch and shows the English text with `lang="en"` (D-255).                                                                                                                                                                                                                                                                                                                                                                                                                      |
| REQ-PAGE-006 | M   | **404:** a bilingual `404.html` with links to home, help and support. GitHub Pages serves it for every unknown path under the base.                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| REQ-PAGE-007 | M   | **Shell:** every page has a skip link, a header (the wordmark links home; nav: Help, Playground, Support, Privacy; a language switch; a theme toggle) and a footer (GitHub repository, changelog, privacy, support, MIT license). Navigation items for pages that don't exist yet are hidden by the route table, not by hand.                                                                                                                                                                                                                                                                         |
| REQ-PAGE-008 | M   | **Screenshots** (W2) are generated by Playwright from the real e2e build of the extension, in light and dark and in en and nl (D-251). The page shows the set that matches the active language and theme. The same files feed the store listings (T-152).                                                                                                                                                                                                                                                                                                                                             |

### 5.3 Privacy policy — `POLICY`

| ID             | P   | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------- | --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-POLICY-001 | M   | `/privacy/` renders `PRIVACY.md`, and `/nl/privacy/` renders `PRIVACY.nl.md`, at build time. No other copy of the policy exists (D-249). Both files have the same heading structure, which a parity test checks.                                                                                                                                                                                                                                                                                                                                                                                    |
| REQ-POLICY-002 | M   | The policy covers **the extension** (every point from REQ-PRIV-007: no data is collected; the favicon image request; pages can detect injected marks; the title prefix ends up in browser history; exports contain internal hostnames; the permissions and why they're needed) **and the website** (no cookies, analytics or third-party requests; the theme choice in local storage; GitHub Pages as the host processes IP addresses in its server logs, with a link to GitHub's privacy statement; GitHub Issues are public and governed by GitHub). A test checks that every section is present. |
| REQ-POLICY-003 | M   | It names the controller: **Niels Brakel, the Netherlands**. The contact routes are GitHub Issues for questions and private vulnerability reporting for anything sensitive (D-248). No email address or postal address.                                                                                                                                                                                                                                                                                                                                                                              |
| REQ-POLICY-004 | M   | Each policy file has a `Last updated: YYYY-MM-DD` line, which the page shows. CI fails when a pull request changes a policy file without changing that line.                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| REQ-POLICY-005 | M   | **Stable URLs:** `/privacy/`, `/nl/privacy/`, `/support/` and `/nl/support/` never move, because store listings link to them. A route test pins them.                                                                                                                                                                                                                                                                                                                                                                                                                                               |

### 5.4 Playground — `PLAY` (W2)

| ID           | P   | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------ | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-PLAY-001 | M   | `/playground/` shows a mock browser window (tab title, address bar with a sample URL, sample page content with a "Delete customer" button) and controls: a color preset (red, amber, blue, slate, custom hex), the mark text, the page effects (ribbon + corner, banner + edge, frame, tint, stripes, watermark, title prefix shown in the mock tab) and element effects on the sample button (outline, tint, stripes, ribbon). |
| REQ-PLAY-002 | M   | The marks are rendered by **the extension's code**: a render plan from `src/core/render/compose.ts`, built from a playground-local `SiteGroup` and drawn by `src/shared/marker-view` inside the shared mock-browser preview component (`src/ui/components`, D-254). The website keeps no copy of any effect styles. Nothing is persisted.                                                                                       |
| REQ-PLAY-003 | M   | Without JavaScript, the prerendered page shows a generated static image of the default preview and a short note that the playground needs JavaScript.                                                                                                                                                                                                                                                                           |
| REQ-PLAY-004 | M   | **Home hero:** a smaller version on the home page with only the four presets, built from the same components.                                                                                                                                                                                                                                                                                                                   |
| REQ-PLAY-005 | M   | Accessible: labeled native controls, fully keyboard-operable. The mark text is exposed as in REQ-A11Y-006, `prefers-reduced-motion` is respected, and color is never the only cue (presets have names).                                                                                                                                                                                                                         |
| REQ-PLAY-006 | M   | Custom input is validated with the **core schemas** (hex color, mark text limits) and shows the same error messages as the options page.                                                                                                                                                                                                                                                                                        |

### 5.5 Search — `SEO`

| ID          | P   | Requirement                                                                                                                                                                                                                                                                      |
| ----------- | --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-SEO-001 | M   | Every route has a unique `<title>` (≤ 60 characters) and meta description (≤ 160 characters) from its locale catalog, and exactly one `<h1>`. Tested per locale.                                                                                                                 |
| REQ-SEO-002 | M   | Every route has an absolute canonical URL with a trailing slash, `hreflang` alternates for `en`, `nl` and `x-default` (→ en), and `<html lang>`.                                                                                                                                 |
| REQ-SEO-003 | M   | `sitemap.xml` lists every route with `xhtml:link` language alternates and is linked from the footer. There is **no `robots.txt`**: a project site can't serve one at the domain root, so crawlers ignore it (D-256).                                                             |
| REQ-SEO-004 | M   | Open Graph and Twitter card tags (title, description, `og:locale` `en_US` / `nl_NL`, and `og:image` = `design/social-preview.png`, 1280 × 640) on every route.                                                                                                                   |
| REQ-SEO-005 | M   | The home routes include JSON-LD `SoftwareApplication` data (name, description, `applicationCategory`, supported browsers, price 0, MIT license, URL). It is a non-executable data block, so the CSP doesn't apply.                                                               |
| REQ-SEO-006 | M   | **Linked everywhere** (D-256): the README, the GitHub About _Website_ field, `package.json` `homepage`, the manifest `homepage_url`, and the store listings' website, privacy and support fields. A test checks that `package.json` and the built manifests use the website URL. |

### 5.6 Theme, language & accessibility — `WEBUX`

| ID            | P   | Requirement                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-WEBUX-001 | M   | Same design system: `src/styles/tokens.css` + `base.css`, CSS Modules, system fonts, no raw colors (stylelint). Website-only tokens (layout widths, the larger type sizes) live in `website/src/styles/website-tokens.css` and never define colors.                                                                                                                                                           |
| REQ-WEBUX-002 | M   | **Theme:** follows the OS by default. The toggle (auto / light / dark) stores its choice under REQ-WEB-004's key. A small inline bootstrap script (hash-pinned in the CSP) applies it before first paint, so there is no flash. Without JavaScript the website follows the OS.                                                                                                                                |
| REQ-WEBUX-003 | M   | **i18n:** every string lives in `website/locales/{en,nl}/messages.json` (the `chrome.i18n` format), or in `public/_locales` for strings used by reused extension components. The keys, placeholders and non-empty values match across locales, and keys are never duplicated between the two catalogs. Strings go through the shared translator (D-247). No hard-coded user-facing strings (`noJsxLiterals`). |
| REQ-WEBUX-004 | M   | **Language routing** (D-255): English at `/SiteMark/`, Dutch at `/SiteMark/nl/`, with the same slugs in both. The language switch links to the same page in the other language. There is no automatic redirect by browser language.                                                                                                                                                                           |
| REQ-WEBUX-005 | M   | **Accessibility:** WCAG 2.2 AA. axe finds 0 serious or critical violations on every route in light and dark, in en and nl. Skip link, landmarks, heading order, visible `outline` focus, targets ≥ 24 × 24 px, 200 % zoom and 320 px reflow, `prefers-reduced-motion` and forced colors.                                                                                                                      |
| REQ-WEBUX-006 | M   | Visual baselines (W2) for every route in light and dark, generated and compared only inside the Playwright container (like REQ-THEME/T-147).                                                                                                                                                                                                                                                                  |

## 6. Routes (normative)

Every route exists in English (`/SiteMark/<slug>`) and Dutch (`/SiteMark/nl/<slug>`).

| Slug             | Page                   | Milestone | Stable (REQ-POLICY-005) |
| ---------------- | ---------------------- | --------- | ----------------------- |
| `/`              | Home                   | W1        |                         |
| `/privacy/`      | Privacy policy         | W1        | ✔                       |
| `/support/`      | Support & contact      | W1        | ✔                       |
| `/help/`         | Help index             | W2        |                         |
| `/help/<topic>/` | Help topic (8 topics)  | W2        |                         |
| `/playground/`   | Playground             | W2        |                         |
| `/changelog/`    | Changelog (en content) | W2        |                         |
| `404.html`       | Not found (bilingual)  | W1        |                         |
| `sitemap.xml`    | Sitemap                | W1        |                         |

## 7. Key flows

1. **From a search:** Google result → home → install button → store listing.
2. **Store reviewer:** listing → privacy URL → `/privacy/` (the same text as `PRIVACY.md`).
3. **Bug report:** popup/options → Copy diagnostics → website support → "Report a bug" → GitHub issue form.
4. **Try before installing** (W2): home hero → pick a preset → "Open the playground" → configure a ribbon and banner → install.

## 8. Later (not in v1)

Google Search Console verification and sitemap submission (would speed up indexing; needs an owner
action); a custom domain; links from the extension to the help pages (options → Help, restricted-page
"Learn more", welcome tab); more languages; search within help; versioned help per release; an RSS feed for the changelog.
