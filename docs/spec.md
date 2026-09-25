# SiteMark — Product specification (v1)

> Status: **Draft for approval** · Owner: repository owner · Process: spec-driven → TDD
> Related: [decisions](decisions.md) · [plan](plan.md) · [tasks](tasks.md) · [design](design.md) · [testing](testing.md)

## 1. Problem

Test, acceptance and production environments of a web app look nearly identical.
With them open side by side it's easy to change data or click "Delete" in the
wrong one. Existing "environment ribbon" extensions are often abandoned,
Chromium-only, ask for access to every site, or only show a generic page banner.

## 2. Vision

**SiteMark** is a small, private, cross-browser extension that makes the
environments you choose unmistakable. You tell it which URLs matter, and it puts
a ribbon, banner, outline, tint or other distinct marker on the page or on a
specific element you pick. Nothing leaves your device.

### Goals

1. **Unmistakable:** a marked environment is recognizable within a glance, even in a
   small window or a screenshot.
2. **Simple:** marking a site takes under 30 seconds (open popup → mark this site → pick → save).
3. **Private:** no install-time host access, no network calls, local storage only.
4. **Safe for the page:** marks never change the page layout or block interaction.
5. **Everywhere:** Chromium, Firefox and Safari from one codebase.

### Non-goals (v1)

Cloud or account sync, team sharing, automatic environment detection, mobile
browsers, screenshot tooling, analytics of any kind.

## 3. Users

| Persona                    | Need                                                                                           |
| -------------------------- | ---------------------------------------------------------------------------------------------- |
| **Dev / tester** (primary) | Juggles local, test, acceptance and prod tabs. Wants prod to scream red and test to look calm. |
| **Support / ops**          | Works in admin panels. Wants the "Delete customer" area outlined on production.                |
| **Presenter**              | Occasionally needs marks hidden temporarily for a demo or screenshot.                          |

## 4. Glossary

| Term             | Meaning                                                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Profile**      | A named group ("Production") with URL patterns, marks, an enabled flag and a priority (its order in the list).                                         |
| **URL pattern**  | A wildcard (`https://*.example.com/admin/*`) or regex rule that decides whether a profile applies to a URL.                                            |
| **Origin grant** | A host permission the user granted for an origin pattern derived from a URL pattern (e.g. `*://*.example.com/*`).                                      |
| **Mark**         | One visual marker in a profile. Its **target** is either the _page_ or an _element_ (CSS selector). Its **style** is a color plus one or more effects. |
| **Effect**       | A visual building block: ribbon, outline, tint, stripes (element or page); banner, frame, watermark, title prefix, favicon tint (page only).           |
| **Picker**       | The in-page mode where hovering outlines elements and clicking selects one.                                                                            |

## 5. Functional requirements

Priority uses MoSCoW: **M**ust / **S**hould / **C**ould. Every requirement has an ID
that tasks and tests reference (`REQ-URL-001`). `pnpm progress` reports any
requirement that has no task or no test.

### 5.1 URL matching — `URL`

| ID          | P   | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------- | --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-URL-001 | M   | **Wildcard syntax** `scheme://host[:port]/path`. **Scheme:** `http`, `https` or `*` (either). **Host:** exact, or a leading `*.`, which matches the domain itself and every subdomain, or `*` alone for any host. **Port:** if given it must match, otherwise any port matches. **Path:** `*` matches any run of characters including `/`, and a missing path means `/*`. The host is case-insensitive and the path case-sensitive. The URL fragment (`#…`) is ignored and the query string is part of the path. |
| REQ-URL-002 | M   | **Shorthand:** a bare host (`example.com`, `*.example.com`, `localhost:3000`) expands to `*://<host>/*`.                                                                                                                                                                                                                                                                                                                                                                                                         |
| REQ-URL-003 | M   | **Validation:** invalid patterns are rejected with a human-readable reason (e.g. "wildcard in the middle of a host is not supported"). Invalid patterns are never saved.                                                                                                                                                                                                                                                                                                                                         |
| REQ-URL-004 | M   | **Regex mode** (advanced): a JavaScript regex tested against the full URL without the fragment. Max 500 characters. Invalid syntax is rejected with the engine's message. A regex pattern needs one or more explicit **origins** (prefilled from the current tab) because permissions can't be derived from a regex.                                                                                                                                                                                             |
| REQ-URL-005 | M   | **Origin derivation:** every wildcard pattern maps to a browser match pattern for permissions (`https://*.example.com/admin/*` → `https://*.example.com/*`; any port → dropped; `http`+`https` → `*`).                                                                                                                                                                                                                                                                                                           |
| REQ-URL-006 | M   | **Profile matching:** a profile matches a URL when it is enabled and at least one of its patterns matches. Matching is pure and deterministic, and the result is ordered by profile priority.                                                                                                                                                                                                                                                                                                                    |
| REQ-URL-007 | S   | **Live tester:** while editing patterns, the UI shows whether the current tab URL (or a typed test URL) matches, and which pattern matched.                                                                                                                                                                                                                                                                                                                                                                      |
| REQ-URL-008 | C   | **Exclude patterns:** a profile may list patterns that suppress a match (e.g. prod except `/status`).                                                                                                                                                                                                                                                                                                                                                                                                            |

**Acceptance examples (REQ-URL-001/002)**

| Pattern                    | URL                                 | Match?  |
| -------------------------- | ----------------------------------- | ------- |
| `https://*.example.com/*`  | `https://example.com/`              | ✅      |
| `https://*.example.com/*`  | `https://a.b.example.com/x?y=1#z`   | ✅      |
| `https://*.example.com/*`  | `http://example.com/`               | ❌      |
| `https://*.example.com/*`  | `https://notexample.com/`           | ❌      |
| `*://example.com/admin/*`  | `http://example.com/admin/users`    | ✅      |
| `*://example.com/admin/*`  | `https://example.com/administrator` | ❌      |
| `example.com`              | `https://example.com:8443/anything` | ✅      |
| `localhost:3000`           | `http://localhost:3001/`            | ❌      |
| `https://EXAMPLE.com/Path` | `https://example.com/Path`          | ✅      |
| `https://example.com/Path` | `https://example.com/path`          | ❌      |
| `https://ex*ple.com/*`     | —                                   | invalid |

### 5.2 Profiles — `PROF`

| ID           | P   | Requirement                                                                                                                                                                                                  |
| ------------ | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| REQ-PROF-001 | M   | Create, rename, update and delete profiles. Delete asks for confirmation (with undo for 10 s in the options page).                                                                                           |
| REQ-PROF-002 | M   | A profile has 1..n URL patterns and 0..n marks. A profile with no patterns can't be enabled.                                                                                                                 |
| REQ-PROF-003 | M   | Enable or disable a profile globally (options page and popup).                                                                                                                                               |
| REQ-PROF-004 | M   | **Priority** = list order. Reorder by drag and drop **and** by "Move up/down" buttons (keyboard accessible).                                                                                                 |
| REQ-PROF-005 | M   | **All matching profiles apply** (D-016). Page-level effects of the same kind stack in priority order (e.g. two banners stack top-down), and the highest priority wins the tab-title prefix and favicon tint. |
| REQ-PROF-006 | S   | Duplicate a profile (new IDs, name suffixed with "copy").                                                                                                                                                    |

### 5.3 Marks — `MARK`

| ID           | P   | Requirement                                                                                                                                                                                                                                                             |
| ------------ | --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-MARK-001 | M   | A mark has a **target** (`page`, or `element` + CSS selector), an optional label, an enabled flag and a **style**: a primary `color` (hex), a `textColor` (`auto` or hex) and one or more effects.                                                                      |
| REQ-MARK-002 | M   | **Ribbon** (element or page): diagonal corner ribbon with text (≤ 24 chars) at `top-left`, `top-right`, `bottom-left` or `bottom-right`.                                                                                                                                |
| REQ-MARK-003 | M   | **Outline** (element): width 1–8 px, `solid`/`dashed`/`dotted`, optional **pulse** animation (disabled under `prefers-reduced-motion`).                                                                                                                                 |
| REQ-MARK-004 | M   | **Tint** (element or page): semi-transparent overlay of the color, opacity 5–60 %.                                                                                                                                                                                      |
| REQ-MARK-005 | M   | **Banner** (page): sticky bar at `top` or `bottom` with text (≤ 60 chars), `compact` or `regular` height. It overlays the page (no layout shift) and can be collapsed to a small tab by hovering + clicking its chevron (the collapse is per tab and resets on reload). |
| REQ-MARK-006 | M   | **Frame** (page): a colored border of 2–16 px around the viewport.                                                                                                                                                                                                      |
| REQ-MARK-007 | S   | **Stripes** (element or page): diagonal hazard-tape pattern in the mark color, opacity 5–40 %. On a page it's drawn as a 6 px strip along the top edge, or across the whole page at low opacity.                                                                        |
| REQ-MARK-008 | S   | **Watermark** (page): repeated rotated text (≤ 24 chars) across the viewport at 4–20 % opacity.                                                                                                                                                                         |
| REQ-MARK-009 | S   | **Title prefix** (page): prepends text to `document.title` (e.g. `[PROD] `) and keeps it applied when the page changes the title. The original title is restored when the mark is removed.                                                                              |
| REQ-MARK-010 | S   | **Favicon tint** (page): replaces the favicon with the original drawn on a canvas plus a colored corner dot. If the original can't be read (CORS), a generated colored-square SVG favicon is used. The original is restored when the mark is removed.                   |
| REQ-MARK-011 | M   | **Auto text color:** with `textColor: auto`, pick black or white, whichever gives the higher WCAG contrast on `color`.                                                                                                                                                  |
| REQ-MARK-012 | M   | **Color presets:** Production red, Staging amber, Test violet, Local green, Info blue, plus a custom hex input and the native color picker.                                                                                                                             |
| REQ-MARK-013 | S   | **Live preview** of a mark's style in the options page on a mock browser page/element.                                                                                                                                                                                  |
| REQ-MARK-014 | M   | Page-only effects (banner, frame, watermark, title prefix, favicon) are rejected by validation on element targets.                                                                                                                                                      |

### 5.4 Renderer (content script) — `RND`

| ID          | P   | Requirement                                                                                                                                                                                                                              |
| ----------- | --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-RND-001 | M   | All visuals render inside **one** host element (`<sitemark-root>`) with a **closed shadow root**. Page CSS doesn't affect marks and mark CSS doesn't leak. Title prefix and favicon are the only page mutations and both are reversible. |
| REQ-RND-002 | M   | Marks never intercept input (`pointer-events: none`, except the banner collapse control) and never shift layout.                                                                                                                         |
| REQ-RND-003 | M   | Element overlays track their target through scroll (including nested scroll containers), resize, `ResizeObserver` and DOM moves, with updates batched per animation frame. The overlay hides when the target is hidden or detached.      |
| REQ-RND-004 | M   | **SPA navigation:** on URL changes (history API, `popstate`, `hashchange`) profiles are re-matched and marks updated without a reload.                                                                                                   |
| REQ-RND-005 | M   | **Missing element** (D-017): the selector is retried through a debounced `MutationObserver`. Status (`found`/`missing`) per mark is reported to the popup. Nothing is shown in the page for missing elements.                            |
| REQ-RND-006 | M   | Marks stay on top: the host uses the top layer (Popover API) when available (D-108), otherwise `z-index: 2147483647`.                                                                                                                    |
| REQ-RND-007 | M   | **Live updates:** changes in storage (options/popup) apply to open tabs within 250 ms without a reload.                                                                                                                                  |
| REQ-RND-008 | M   | **Hide temporarily** (D-018): hides all marks on the current tab until reload or navigation. Title and favicon are restored while hidden.                                                                                                |
| REQ-RND-009 | M   | **Robustness:** renderer errors are caught and logged with a `[SiteMark]` prefix and never break the host page. No match → the script does nothing (no DOM changes, no observers).                                                       |
| REQ-RND-010 | S   | Marks are hidden in print (D-109).                                                                                                                                                                                                       |
| REQ-RND-011 | M   | User text is rendered with `textContent` only (never `innerHTML`). Colors are validated hex values.                                                                                                                                      |

### 5.5 Picker — `PICK`

| ID           | P   | Requirement                                                                                                                                                                                                                                                                                                                                            |
| ------------ | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| REQ-PICK-001 | M   | Start the picker from the popup ("Pick element") or the keyboard shortcut (REQ-CMD-001). It is injected on demand via `activeTab` + `scripting.executeScript`, so it works before a host permission exists.                                                                                                                                            |
| REQ-PICK-002 | M   | Hover outlines the element under the cursor and shows a tooltip (`tag#id.class` · size). Click selects it. **Esc** cancels. **Keyboard:** `↑` parent, `↓` first child, `←/→` siblings, `Enter` select.                                                                                                                                                 |
| REQ-PICK-003 | M   | While picking, page handlers don't receive the click/pointer events (capture phase, `preventDefault` + `stopImmediatePropagation`). Everything is restored on exit.                                                                                                                                                                                    |
| REQ-PICK-004 | M   | **Selector generation** (D-105): prefers a stable `id`, then `data-testid`/`data-test`/`data-qa`/`data-cy`, `aria-label`, `name`, `role`, then non-hashed classes, then `:nth-of-type` path. Must resolve to **exactly** the picked element, max 300 chars. Generated IDs/classes (e.g. `css-1x2y3z`, `sc-…`, `_a1b2c3`, long hex/digits) are skipped. |
| REQ-PICK-005 | M   | After a pick, an in-page **mini panel** (shadow DOM, neumorphic) shows: the editable selector with a match count, a profile choice (matching profiles, or "New profile for `<origin>`"), a style preset, and **Save / Cancel / More options…**. "More options" opens the options page deep-linked to the new mark.                                     |
| REQ-PICK-006 | M   | If the origin isn't granted when saving, the panel says so and offers **Allow on this site**, which opens the permission flow (REQ-PRIV-002). The mark already shows on this tab through `activeTab`.                                                                                                                                                  |
| REQ-PICK-007 | S   | **Re-pick** (from the popup's missing-element state) opens the picker and replaces the selector of that mark.                                                                                                                                                                                                                                          |

### 5.6 Privacy & permissions — `PRIV`

| ID           | P   | Requirement                                                                                                                                                                                                             |
| ------------ | --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-PRIV-001 | M   | The manifest requests only `storage`, `scripting` and `activeTab`, with **no** `host_permissions` and **no** static `content_scripts`. `optional_host_permissions: ["*://*/*"]`.                                        |
| REQ-PRIV-002 | M   | When a pattern is saved, the derived origins are requested with `permissions.request` from a user gesture in an extension page (D-106). Each pattern shows **Granted / Not granted — Allow**.                           |
| REQ-PRIV-003 | M   | The marker content script is registered with `scripting.registerContentScripts` **only for granted origins**. The registration is re-synced on install, startup, `permissions.onAdded`/`onRemoved` and profile changes. |
| REQ-PRIV-004 | S   | When patterns or profiles are removed, offer to revoke origins that no remaining pattern uses.                                                                                                                          |
| REQ-PRIV-005 | M   | **No network:** no remote code, analytics, fonts or CDNs. Extension pages use a strict CSP (`script-src 'self'; object-src 'none'`) and no `fetch`/XHR/WebSocket/beacon. Enforced by an automated test.                 |
| REQ-PRIV-006 | M   | Data is only stored in `storage.local` (never `storage.sync`) (D-009).                                                                                                                                                  |
| REQ-PRIV-007 | M   | A plain-language `PRIVACY.md` (for store listings) states that no data is collected or transmitted.                                                                                                                     |

### 5.7 Data, import & export — `DATA`

| ID           | P   | Requirement                                                                                                                                                                                                                                                                                                                          |
| ------------ | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| REQ-DATA-001 | M   | Stored state is versioned (`schemaVersion`) and validated on read. Corrupt or unknown data falls back to safe defaults and shows a recoverable error in the options page; the raw data is kept under a backup key.                                                                                                                   |
| REQ-DATA-002 | M   | Schema migrations run automatically and are unit-tested per version step.                                                                                                                                                                                                                                                            |
| REQ-DATA-003 | M   | **Export** writes all profiles and settings as pretty JSON, `sitemark-export-YYYY-MM-DD.json`, including `schemaVersion`, `exportedAt` and `appVersion`. It is a local download only.                                                                                                                                                |
| REQ-DATA-004 | M   | **Import**: pick a file (≤ 1 MB). It is validated (older schema versions are migrated) and a preview is shown (N profiles, M marks, K new origins, regex patterns highlighted). The user chooses **Merge** (adds; ID clashes get new IDs) or **Replace** (with confirmation). Invalid files show readable errors and change nothing. |
| REQ-DATA-005 | M   | After import, all new origins are requested in **one** permission prompt.                                                                                                                                                                                                                                                            |
| REQ-DATA-006 | C   | Export a single profile.                                                                                                                                                                                                                                                                                                             |

### 5.8 Popup — `POP`

| ID          | P   | Requirement                                                                                                                                                                                                   |
| ----------- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-POP-001 | M   | Shows the current site (origin) and every matching profile (color chip, name, enabled toggle), or an empty state: "No profile matches this site" plus **Mark this site**.                                     |
| REQ-POP-002 | M   | For each element mark of a matching profile: status **found / not found**, with **Re-pick** when not found.                                                                                                   |
| REQ-POP-003 | M   | Actions: **Pick element**, **Hide marks on this tab** (toggle), **Settings**.                                                                                                                                 |
| REQ-POP-004 | M   | If a matching pattern's origin isn't granted: warning plus **Allow** button (REQ-PRIV-002).                                                                                                                   |
| REQ-POP-005 | M   | On restricted pages (`chrome://`, `about:`, `edge://`, store pages, `file://` without access) it shows "SiteMark can't run on this page" and disables picking.                                                |
| REQ-POP-006 | M   | **Mark this site** creates a profile named after the host with pattern `<scheme>://<host>/*`, requests the permission, applies a default page ribbon (Production red, "PRODUCTION") and shows it immediately. |

### 5.9 Options page — `OPT`

| ID          | P   | Requirement                                                                                                                                                                                        |
| ----------- | --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-OPT-001 | M   | Layout: profile list (sidebar: color chip, name, enabled switch, reorder) and editor pane. Hash routing for deep links (`#/profiles/:id`, `#/profiles/:id/marks/:markId`, `#/settings`, `#/data`). |
| REQ-OPT-002 | M   | Profile editor: name, enabled, patterns (add wildcard/regex, inline validation, permission status, live tester), marks list.                                                                       |
| REQ-OPT-003 | M   | Mark editor: target (page/element + selector input with syntax check), color presets + custom, text color, effect toggles with their settings, and live preview (REQ-MARK-013).                    |
| REQ-OPT-004 | M   | Settings: theme (System / Light / Dark), keyboard shortcut info (current binding, plus a link/instructions to change it per browser).                                                              |
| REQ-OPT-005 | M   | Data section: export, import (REQ-DATA-003/004), and "Reset everything" (double confirmation).                                                                                                     |
| REQ-OPT-006 | S   | Autosave with a subtle "Saved" status. Invalid fields block only themselves, not the rest of the form.                                                                                             |

### 5.10 Commands — `CMD`

| ID          | P   | Requirement                                                                                                                                  |
| ----------- | --- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-CMD-001 | M   | Command `start-picker`, suggested `Alt+Shift+M`, remappable through the browser's shortcut settings. It starts the picker in the active tab. |

### 5.11 Theme — `THEME`

| ID            | P   | Requirement                                                                                                                         |
| ------------- | --- | ----------------------------------------------------------------------------------------------------------------------------------- |
| REQ-THEME-001 | M   | Popup, options and the in-page picker panel follow the OS color scheme by default. The override (light/dark) is stored in settings. |
| REQ-THEME-002 | M   | All colors come from design tokens (`src/styles/tokens.css`). No hard-coded colors in components.                                   |

### 5.12 Internationalization — `I18N`

| ID           | P   | Requirement                                                                                                     |
| ------------ | --- | --------------------------------------------------------------------------------------------------------------- |
| REQ-I18N-001 | M   | Every UI string exists in `en` and `nl` (`public/_locales`). A test enforces key parity and non-empty messages. |
| REQ-I18N-002 | M   | No hard-coded user-facing strings in components (lint rule / test).                                             |
| REQ-I18N-003 | M   | User content (profile names, mark texts) is never translated.                                                   |

### 5.13 Accessibility — `A11Y`

| ID           | P   | Requirement                                                                                                       |
| ------------ | --- | ----------------------------------------------------------------------------------------------------------------- |
| REQ-A11Y-001 | M   | WCAG 2.2 AA contrast for all extension UI text in both themes.                                                    |
| REQ-A11Y-002 | M   | Everything is operable by keyboard, including the picker (REQ-PICK-002) and reordering (REQ-PROF-004).            |
| REQ-A11Y-003 | M   | Visible focus indicator on every interactive element (token `--sm-focus-ring`).                                   |
| REQ-A11Y-004 | M   | Automated axe checks for popup and options (0 serious/critical violations).                                       |
| REQ-A11Y-005 | M   | `prefers-reduced-motion` disables pulse and other animations.                                                     |
| REQ-A11Y-006 | S   | The page banner exposes its text to assistive tech (`role="note"`). Purely decorative overlays are `aria-hidden`. |

## 6. Non-functional requirements — `NFR`

| ID          | P   | Requirement                                                                                                                                                                |
| ----------- | --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-NFR-001 | M   | **Compatibility:** Chrome/Edge ≥ 120 (and Chromium derivatives), Firefox ≥ 140, Safari ≥ 17 (macOS). One codebase; browser quirks isolated in `src/platform/`.             |
| REQ-NFR-002 | M   | **Size:** the marker content script is ≤ 25 KB gzip and the picker ≤ 20 KB gzip (no React in content scripts, D-101). Checked in CI.                                       |
| REQ-NFR-003 | M   | **Performance:** on a non-matching page the content script finishes in < 2 ms. With 10 element marks, tracking costs < 1 ms per frame on average while scrolling.          |
| REQ-NFR-004 | M   | **Quality gates:** typecheck, lint, format, unit/component tests (coverage ≥ 90 % lines for `src/core`, ≥ 80 % overall) and e2e must pass in CI before merge.              |
| REQ-NFR-005 | M   | **Security:** no `eval`/`new Function`, no remote code, strict CSP, and all imported data validated (REQ-DATA-004).                                                        |
| REQ-NFR-006 | S   | **Store readiness:** zips for Chrome Web Store, Edge Add-ons and Firefox AMO via `wxt zip`. Safari Xcode project via converter. Store listing texts in en/nl. Screenshots. |

## 7. Data model (normative)

```ts
type Hex = `#${string}`; // validated: /^#[0-9a-f]{6}$/i

interface SiteMarkState {
  schemaVersion: 1;
  profiles: Profile[]; // array order = priority (index 0 = highest)
  settings: Settings;
}

interface Settings {
  theme: 'system' | 'light' | 'dark';
}

interface Profile {
  id: string; // nanoid-like, 12 chars
  name: string; // 1..40 chars
  enabled: boolean;
  patterns: UrlPattern[]; // ≥ 1 to be enabled
  excludes?: UrlPattern[]; // REQ-URL-008 (Could)
  marks: Mark[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

type UrlPattern =
  | { id: string; kind: 'wildcard'; value: string }
  | { id: string; kind: 'regex'; value: string; origins: string[] }; // origins = match patterns

interface Mark {
  id: string;
  label?: string; // shown in popup/options only
  enabled: boolean;
  target: { kind: 'page' } | { kind: 'element'; selector: string };
  style: MarkStyle;
}

interface MarkStyle {
  color: Hex;
  textColor: 'auto' | Hex;
  ribbon?: { text: string; position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' };
  outline?: { width: number; style: 'solid' | 'dashed' | 'dotted'; pulse: boolean }; // element only
  tint?: { opacity: number }; // 0.05..0.6
  stripes?: { opacity: number; area: 'edge' | 'full' }; // 0.05..0.4
  // page-only
  banner?: { text: string; position: 'top' | 'bottom'; size: 'compact' | 'regular' };
  frame?: { width: number }; // 2..16
  watermark?: { text: string; opacity: number }; // 0.04..0.2
  titlePrefix?: { text: string };
  favicon?: { enabled: true };
}
```

At least one effect must be set. Export envelope:
`{ "format": "sitemark-export", "schemaVersion": 1, "appVersion": "x.y.z", "exportedAt": ISO, "profiles": [...], "settings": {...} }`.

## 8. Key flows

1. **First run:** install (no warnings) → a welcome state in the options page explains marking in 3 steps → the user clicks the toolbar icon on their prod site.
2. **Mark this site (popup):** Mark this site → permission prompt for the origin → profile created with a default ribbon → mark appears → optional "Pick element".
3. **Pick element:** popup "Pick element" or `Alt+Shift+M` → hover/select → mini panel → Save → overlay appears → (if not granted) Allow on this site.
4. **Fine-tune:** options → profile → mark editor → live preview → autosave → open tabs update live.
5. **Move to a new laptop:** options → Data → Export → file → new browser → Import → preview → Merge → one permission prompt.

## 9. Later (explicitly not v1)

Toolbar badge per profile, starter templates, in-app language override,
additional languages, per-profile export, exclude patterns (if not done in v1),
mobile (Firefox Android, Safari iOS), optional encrypted sync.
