# SiteMark — Product specification (v1)

> Status: **Approved draft, rev 2** (after the [2026-09-25 plan review](reviews/2026-09-25-plan-review.md))
> Related: [decisions](decisions.md) · [plan](plan.md) · [tasks](tasks.md) · [design](design.md) · [testing](testing.md)

## 1. Problem

Test, acceptance and production environments of a web app look nearly identical. With them
open side by side, it's easy to change data or click "Delete" in the wrong one. Existing
"environment ribbon" extensions are often abandoned or Chromium-only, ask for access to every
site, or only offer a generic page banner.

## 2. Vision and success

**SiteMark** is a small, private, cross-browser extension that makes the sites you choose
unmistakable. You tell it which URLs matter, and it puts a ribbon, banner, frame, outline,
tint or another distinct marker on the page, or on a specific element you pick. Nothing
leaves your device.

**Goals.**

1. **Unmistakable:** you recognize a marked site at a glance, and color is never the only cue.
2. **Simple:** marking a site takes ≤ 30 s (popup → Mark this site → Allow).
3. **Private:** no install-time host access, no network calls of its own, local storage only.
4. **Safe for the page:** no layout shift, and marks never block interaction.
5. **Cross-browser:** Chromium + Firefox in v1.0, Safari in v1.1 (D-213).

**Non-goals (v1).** Cloud or account sync, team sharing, automatic environment detection,
mobile browsers, analytics of any kind. SiteMark is **not a security control**: a hostile
site can hide or spoof marks (D-239).

**Success signals (no telemetry).**

- Zero outbound extension requests in every e2e flow.
- Size and performance budgets are green in CI.
- The manual smoke checklist passes for every release.
- 5 moderated "mark my site" sessions each finish in ≤ 30 s.
- Store ratings ≥ 4.5.
- Few "wrong site marked" or "element not found" issues.
- The owner dogfoods it for 2 weeks before 1.0.

## 3. Users

| Persona                    | Need                                                                                      |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| **Dev / tester** (primary) | Juggles local, test, acceptance and prod tabs, and wants each one instantly recognizable. |
| **Support / ops**          | Works in admin panels, and wants the "Delete customer" button outlined on production.     |
| **Presenter**              | Needs to hide marks temporarily for a demo or screenshot, ideally with a key.             |

## 4. Glossary (the same terms are used in the UI, the docs and the code)

| Term             | Meaning                                                                                                                                                                     |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Site group**   | A named group (e.g. "Production") with URL patterns, marks, an enabled flag and a priority, which is its position in the list. In code: `SiteGroup`.                        |
| **URL pattern**  | A wildcard (`https://*.example.com/admin/*`) or a safe-subset regex. It decides whether a site group applies to a URL.                                                      |
| **Origin grant** | A browser host permission for a match pattern derived from a URL pattern (`*://*.example.com/*`).                                                                           |
| **Mark**         | One visual marker in a site group. It is either a **page mark** or an **element mark** (targeted by a CSS selector), and has a color, a text color and at least one effect. |
| **Effect**       | A visual building block. Page effects: ribbon, banner, frame, tint, stripes, watermark, title prefix, favicon. Element effects: ribbon, outline, tint, stripes.             |
| **Render plan**  | The ordered, keyed list of effects the background computes for one URL and pushes to that tab.                                                                              |
| **Picker**       | The in-page mode for choosing an element: a glass pane with hover and keyboard selection, followed by a mini panel.                                                         |

## 5. Functional requirements

Priority: **M**ust / **C**ould. Everything in v1 is Must except the two Could items (D-216).
Every requirement has an ID that tasks and tests reference. `pnpm progress --strict` fails
when a requirement has no task, or when a finished task has an uncovered requirement.

### 5.1 URL matching — `URL`

| ID          | P   | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ----------- | --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-URL-001 | M   | **Wildcard syntax** `scheme://host[:port][/path]`. **Scheme:** `http`, `https` or `*` (either). **Host:** an exact host, or `*.` + a domain, which matches the domain itself and all its subdomains. IDN hosts are converted to punycode and lowercased. A trailing dot is ignored. IPv6 goes in brackets (`[::1]`). **Port:** if given it must match, otherwise any port matches. **Path:** `*` matches any run of characters, including `/`. A missing path means `/*`. Without `*`, the path must match exactly (`/admin` ≠ `/admin/`). **Query:** ignored, unless the pattern path contains `?`; then path and query are matched together. The fragment is always ignored. The host is case-insensitive and the path case-sensitive. |
| REQ-URL-002 | M   | **Shorthand:** a pattern without a scheme (`example.com`, `*.example.com`, `localhost:3000`, `example.com/admin/*`) means `*://<pattern>`. The path defaults to `/*`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| REQ-URL-003 | M   | **Validation:** an invalid pattern is rejected with a typed error code, shown as readable text (e.g. "A wildcard is only allowed at the start of the host"). Invalid patterns are never stored.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| REQ-URL-004 | M   | **Regex (advanced), safe subset only** (D-211). Not allowed: backreferences, lookaround, nested quantifiers (star height ≤ 1). Maximum 500 characters; flags are fixed by the code. The regex is tested against the full URL without the fragment, only for URLs ≤ 2048 characters, and only after one of its 1–20 explicit **origins** (prefilled from the current tab) matches. A rejected regex shows the reason.                                                                                                                                                                                                                                                                                                                     |
| REQ-URL-005 | M   | **Origin derivation:** each wildcard pattern maps to a browser match pattern used for permissions, e.g. `https://*.example.com/admin/*` → `https://*.example.com/*`. The port is dropped, and `http` + `https` become `*`. Property-tested invariant: if a pattern matches a URL, its origin pattern matches that URL too.                                                                                                                                                                                                                                                                                                                                                                                                               |
| REQ-URL-006 | M   | **Matching:** `patternMatches(group, url)` ignores the enabled flag. `isActive(group, url)` = enabled ∧ patternMatches ∧ not excluded. Results are ordered by group priority. Rendering uses `isActive`; the popup lists every group that `patternMatches`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| REQ-URL-007 | M   | **Live tester:** while patterns are being edited, the UI shows whether the current tab URL (or a typed URL) matches, and which pattern matched.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| REQ-URL-008 | C   | **Exclude patterns:** a site group can list patterns that suppress a match (e.g. prod, except `/status`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| REQ-URL-009 | M   | **No broad patterns** (D-212). Rejected: a `*` host, `*.<public suffix>`, and `<all_urls>`. Public suffixes come from a built-in list of common multi-part suffixes plus every single-label TLD. This applies both to manual entry and to import.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| REQ-URL-010 | M   | **Linear-time matching:** wildcard matching uses a non-backtracking glob matcher, not `RegExp`. Each pattern is limited to 500 characters and 10 `*`. A 10-star pattern checked against an 8 KB URL takes < 5 ms.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

**Acceptance examples (REQ-URL-001/002/009)**

| Pattern                     | URL                                 | Result             |
| --------------------------- | ----------------------------------- | ------------------ |
| `https://*.example.com/*`   | `https://example.com/`              | ✅                 |
| `https://*.example.com/*`   | `https://a.b.example.com/x?y=1#z`   | ✅                 |
| `https://*.example.com/*`   | `http://example.com/`               | ❌                 |
| `https://*.example.com/*`   | `https://notexample.com/`           | ❌                 |
| `*://example.com/admin/*`   | `http://example.com/admin/users`    | ✅                 |
| `*://example.com/admin/*`   | `https://example.com/administrator` | ❌                 |
| `https://example.com/admin` | `https://example.com/admin?tab=1`   | ✅ (query ignored) |
| `https://example.com/admin` | `https://example.com/admin/`        | ❌ (exact path)    |
| `https://example.com/a?x=*` | `https://example.com/a?x=1`         | ✅                 |
| `example.com`               | `https://example.com:8443/anything` | ✅                 |
| `example.com/admin/*`       | `http://example.com/admin/x`        | ✅                 |
| `localhost:3000`            | `http://localhost:3001/`            | ❌                 |
| `localhost`                 | `http://localhost:5173/`            | ✅ (any port)      |
| `[::1]:3000`                | `http://[::1]:3000/`                | ✅                 |
| `bücher.de`                 | `https://xn--bcher-kva.de/x`        | ✅                 |
| `example.com.`              | `https://example.com/`              | ✅ (trailing dot)  |
| `https://EXAMPLE.com/Path`  | `https://example.com/Path`          | ✅                 |
| `https://example.com/Path`  | `https://example.com/path`          | ❌                 |
| `https://ex*ple.com/*`      | —                                   | invalid            |
| `*` / `*://*/*`             | —                                   | invalid (broad)    |
| `*.com` / `*.co.uk`         | —                                   | invalid (broad)    |
| `file:///C:/x`              | —                                   | invalid (scheme)   |

### 5.2 Site groups — `GRP`

| ID          | P   | Requirement                                                                                                                                                                                                                      |
| ----------- | --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-GRP-001 | M   | Create, rename and delete site groups. New groups are added at the **bottom** of the list. Deleting asks for confirmation, and the options page offers undo for 10 s.                                                            |
| REQ-GRP-002 | M   | A site group has 0–50 URL patterns, 0–50 excludes and 0–50 marks. There can be at most 200 groups. A group needs at least one pattern to be enabled. Removing its last pattern **disables it automatically** and shows a notice. |
| REQ-GRP-003 | M   | A site group can be enabled or disabled globally, **only in the options page** (D-204).                                                                                                                                          |
| REQ-GRP-004 | M   | **Priority** is list order. Groups can be reordered by drag and drop **and** with Move up/down buttons (keyboard accessible).                                                                                                    |
| REQ-GRP-005 | M   | **All active groups apply** (D-016). The composition rules below are normative (D-242).                                                                                                                                          |
| REQ-GRP-006 | M   | Duplicate a site group: new IDs, name + " copy", and disabled until its permissions are granted.                                                                                                                                 |

**Composition rules (REQ-GRP-005).** Effects are ordered by group priority, then by mark order within the group.

| Effect                            | Rule                                                                                                                                   |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Banner                            | **At most one per edge.** The texts of all top (or all bottom) banners are merged as `A · B`, using the first banner's color and size. |
| Frame                             | Nested. The highest priority is outermost.                                                                                             |
| Ribbon (page)                     | One per corner. The highest priority gets the corner.                                                                                  |
| Tint / stripes / watermark (page) | All rendered, layered by priority.                                                                                                     |
| Title prefix / favicon            | Highest priority only.                                                                                                                 |
| Element marks                     | All rendered independently.                                                                                                            |
| Z-order (bottom → top)            | frame < stripes < watermark < tint < banner < ribbon                                                                                   |

### 5.3 Marks — `MARK`

| ID           | P   | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------ | --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-MARK-001 | M   | A mark is either a **page mark** or an **element mark** (CSS selector, 1–500 characters). It has an optional label, an enabled flag, a `color`, a `textColor` (`auto` or a hex value), and at least one effect valid for its target type (spec §7, D-223).                                                                                                                                                                                                  |
| REQ-MARK-002 | M   | **Ribbon** (page or element): a diagonal band across a corner (`top-left`, `top-right`, `bottom-left` or `bottom-right`), with required text of 1–16 characters. The font shrinks from 12 px down to 9 px to fit, then the text is cut off with an ellipsis. On an element whose short side is < 80 px, it becomes a 10 px corner dot.                                                                                                                      |
| REQ-MARK-003 | M   | **Outline** (element): 1–8 px wide, `solid`, `dashed` or `dotted`, with an optional **pulse** (turned off under `prefers-reduced-motion`).                                                                                                                                                                                                                                                                                                                  |
| REQ-MARK-004 | M   | **Tint:** a semi-transparent overlay in the mark color, at 3–15 % opacity on a page or 5–40 % on an element.                                                                                                                                                                                                                                                                                                                                                |
| REQ-MARK-005 | M   | **Banner** (page): a bar on the `top` or `bottom` edge with required text of 1–60 characters, sized `compact` (24 px) or `regular` (36 px). It overlays the page without shifting the layout. A keyboard-focusable chevron collapses it to a 24 × 24 tab. The collapse applies to that banner only, lasts for the life of the document (it survives SPA route changes) and resets on reload.                                                                |
| REQ-MARK-006 | M   | **Frame** (page): a colored border of 2–16 px around the viewport.                                                                                                                                                                                                                                                                                                                                                                                          |
| REQ-MARK-007 | M   | **Stripes:** a diagonal hazard pattern at 5–40 % opacity. On a page, `edge` draws a 6 px strip along the top and `full` covers the viewport. On an element, it covers the element's box.                                                                                                                                                                                                                                                                    |
| REQ-MARK-008 | M   | **Watermark** (page): text (1–24 characters) repeated across the viewport, rotated −30°, at 4–12 % opacity.                                                                                                                                                                                                                                                                                                                                                 |
| REQ-MARK-009 | M   | **Title prefix** (page, **opt-in**): `document.title = trim(prefix) + ' ' + title`, with a prefix of 1–16 characters. It is idempotent (skipped if the title already starts with it). When the page changes its title, the prefix is re-applied, at most 4 times per second. On removal, the prefix is **stripped from the current title** instead of restoring a stale original. Settings help warns that the prefixed title is stored in browser history. |
| REQ-MARK-010 | M   | **Favicon tint** (page, **opt-in**, D-217): draw the **original** favicon onto a 32 px canvas with a 12 px dot in the mark color (2 px white ring), then swap the `<link rel=icon>`. If the original can't be read (CORS, tainted canvas, no favicon), the favicon is left unchanged and the tab status reports `favicon: unavailable`. The original links are restored on removal. Best-effort on Safari.                                                  |
| REQ-MARK-011 | M   | **Auto text color:** with `textColor: auto`, pick black or white, whichever has the higher WCAG contrast against `color`.                                                                                                                                                                                                                                                                                                                                   |
| REQ-MARK-012 | M   | **Color presets** (D-205): red `#c93a2e`, amber `#f4a300`, blue `#1f6feb`, slate `#57606a`. Custom hex values (stored lowercase) and the native color picker are also available.                                                                                                                                                                                                                                                                            |
| REQ-MARK-013 | M   | **Live preview** of a mark in the options page, on a mock browser window, rendered by the same view code as the renderer (`src/shared/marker-view`).                                                                                                                                                                                                                                                                                                        |
| REQ-MARK-014 | M   | Effects that only fit one target type are enforced **by type**. Page-only effects (banner, frame, watermark, title prefix, favicon) can't exist on element marks, and outline can't exist on page marks.                                                                                                                                                                                                                                                    |
| REQ-MARK-015 | M   | **Non-color cue:** ribbon and banner text is mandatory and non-empty, so a mark never relies on color alone.                                                                                                                                                                                                                                                                                                                                                |

### 5.4 Renderer (content script) — `RND`

| ID          | P   | Requirement                                                                                                                                                                                                                                                                                                                                    |
| ----------- | --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-RND-001 | M   | All visuals render inside a **single** host element, `<sitemark-root>`, with a shadow root (closed in production, D-226). The only changes to the page itself are the host, the title and the favicon link, and all three are reversible (D-230).                                                                                              |
| REQ-RND-002 | M   | Marks never intercept input (`pointer-events: none`, except the banner chevron) and never shift layout (page element positions and sizes don't change).                                                                                                                                                                                        |
| REQ-RND-003 | M   | Element overlays follow their target through scrolling (including nested scroll containers), resizing and DOM moves. Updates are batched per animation frame. The overlay hides when its target is hidden or removed.                                                                                                                          |
| REQ-RND-004 | M   | **SPA navigation:** when the URL changes, the tab asks for a new render plan. Polling every 500 ms is the **primary** mechanism, because the Navigation API is missing at the Firefox 140 and Safari 18 minimums. Chrome uses `navigatesuccess` when available.                                                                                |
| REQ-RND-005 | M   | **Element resolution:** the **first** element that matches the selector is marked (D-206). If none matches, a debounced (200 ms) `MutationObserver` retries. Each mark's status (`found`/`missing`) is reported to the background. Nothing is shown on the page for a missing element.                                                         |
| REQ-RND-006 | M   | **Always on top** (D-215): the host uses the Popover API top layer. When a page dialog, popover or fullscreen element enters the top layer (`toggle`, `fullscreenchange`), the host is hidden and shown again to put it back on top. Without the Popover API it falls back to `z-index: 2147483647`. Page `::backdrop` styles are neutralized. |
| REQ-RND-007 | M   | **Live updates:** state changes reach open tabs as a new render plan within 250 ms. Only the effects that changed are re-mounted (keyed diff).                                                                                                                                                                                                 |
| REQ-RND-008 | M   | **Hide on this tab** (D-207): hides all marks and restores the title and favicon. The state lives in content-script memory. It survives SPA route changes and resets on reload, when leaving the origin, or when the tab closes.                                                                                                               |
| REQ-RND-009 | M   | **Robustness:** each effect view is isolated, so one failing effect never removes the others. Errors are logged with a `[SiteMark]` prefix. When no group is active, the script does nothing: no DOM changes and no observers.                                                                                                                 |
| REQ-RND-010 | M   | Marks are hidden when printing.                                                                                                                                                                                                                                                                                                                |
| REQ-RND-011 | M   | User text is inserted with `textContent` only. Colors are applied only as validated hex values through `style.setProperty`. CSS text is never built from user data.                                                                                                                                                                            |
| REQ-RND-012 | M   | **Single instance:** only one marker runs per document, whether it arrived by registration, by `executeScript` after a grant, or by activeTab. A new instance replaces the old one, and an orphaned instance (after an extension update) disposes of itself.                                                                                   |
| REQ-RND-013 | M   | **Proximity fade:** ribbons and banners fade to 15 % opacity while the pointer is within 24 px of them, so page controls underneath stay visible (passive `pointermove`).                                                                                                                                                                      |
| REQ-RND-014 | M   | **Visible on any page:** frames, outlines, ribbons and banners get a 1 px keyline in the auto text color at 60 % opacity. `forced-color-adjust: none` keeps marks intact in forced-colors mode.                                                                                                                                                |

### 5.5 Picker — `PICK`

| ID           | P   | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------ | --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-PICK-001 | M   | The picker starts from the popup ("Pick element") or the `start-picker` command. It is injected on demand through `activeTab` + `scripting.executeScript`, so it works before any host permission exists.                                                                                                                                                                                                                                                                           |
| REQ-PICK-002 | M   | **Selection:** hovering shows a **neutral two-tone dashed outline** (white + `#1b1d22`) around the element under the cursor, plus a tooltip (`tag#id.class · W×H`). Clicking selects it. **Keyboard:** starts at `document.activeElement`, or at the element in the viewport center. `↑` parent, `↓` first child, `←/→` siblings, `Enter` selects, `Esc` cancels.                                                                                                                   |
| REQ-PICK-003 | M   | **No side effects on the page** (D-240). A glass pane in the top layer receives all pointer events. Targets are found with `elementsFromPoint`, skipping SiteMark's own hosts. Focus moves into the picker's shadow root, and only `isTrusted` events count. No page handler (click, pointerdown, mousedown, focus, keydown) fires during a pick, and everything is restored on exit.                                                                                               |
| REQ-PICK-004 | M   | **Selector generation**, in order of preference: a stable `id`; `data-testid`/`data-test`/`data-qa`/`data-cy`; `aria-label`; `name`; `role`; non-hashed classes; an `:nth-of-type` path. The selector must resolve (first match) to the picked element and be ≤ 300 characters. Generated tokens are skipped (`css-1x2y3z`, `sc-…`, `_a1b2c3`, long runs of hex or digits).                                                                                                         |
| REQ-PICK-005 | M   | **Mini panel** after selection (shadow DOM, neumorphic). It contains: an editable selector with a live match indicator; a site group choice (active groups for this URL, or "New site group for `<origin>`"); multi-select **effect chips** (Ribbon · Outline · Tint · Stripes, Outline by default); a color preset; and **Save / Cancel / More options…**. Save sends a `savePick` **intent** to the background (REQ-SEC-001). "More options" opens the options page at that mark. |
| REQ-PICK-006 | M   | If the origin isn't granted when the user saves, the panel shows "Shown on this tab only — **Allow** to keep it". Allow asks the background to open the grant page for the sender's origin (D-229). Until then, the mark shows on this tab through activeTab.                                                                                                                                                                                                                       |
| REQ-PICK-007 | M   | **Re-pick** (offered by the popup when an element isn't found) opens the picker and replaces that mark's selector.                                                                                                                                                                                                                                                                                                                                                                  |
| REQ-PICK-008 | M   | **Frames and components:** picking inside an iframe marks the **iframe element** itself, and picking inside a web component's shadow DOM marks the **component host**. The tooltip says so. In canvas apps, only the whole canvas can be marked.                                                                                                                                                                                                                                    |

### 5.6 Privacy & permissions — `PRIV`

| ID           | P   | Requirement                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------ | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-PRIV-001 | M   | The production manifest requests only `storage`, `scripting` and `activeTab`. It has **no** `host_permissions`, `content_scripts` or `web_accessible_resources`; `optional_host_permissions` is `["*://*/*"]`; and it declares an explicit CSP for extension pages. This is checked on every built target and every release zip.                                                            |
| REQ-PRIV-002 | M   | Adding a pattern (the explicit **Add** button is the user gesture) requests its derived origins with `permissions.request`, called first and synchronously (D-229). Each pattern shows **Granted**, or **Not granted — Allow**. Grant status is read live from `permissions.contains` and never cached.                                                                                     |
| REQ-PRIV-003 | M   | The marker content script is registered with `scripting.registerContentScripts` **only for granted origins that enabled groups use**. Registration runs one at a time, is idempotent, and re-syncs on every background start and whenever permissions or state change (D-231).                                                                                                              |
| REQ-PRIV-004 | M   | After a pattern or group is removed and the undo window has passed, offer to revoke origins that no remaining pattern uses.                                                                                                                                                                                                                                                                 |
| REQ-PRIV-005 | M   | **SiteMark makes no network requests of its own.** No remote code, analytics, fonts or CDNs, and no `fetch`, XHR, WebSocket, beacon or EventSource in the **built output** (scanned in CI). CSP: `script-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; connect-src 'none'`. Documented exception: the opt-in favicon tint loads the site's own favicon image (D-217). |
| REQ-PRIV-006 | M   | Data is stored only in `storage.local`, never `storage.sync`.                                                                                                                                                                                                                                                                                                                               |
| REQ-PRIV-007 | M   | A plain-language `PRIVACY.md` states: no data is collected; the favicon image request; pages can detect injected marks; the title prefix ends up in browser history; exports contain internal hostnames. It is also published on the website ([REQ-POLICY-001](website/spec.md#53-privacy-policy--policy)).                                                                                 |

### 5.7 Data, import & export — `DATA`

| ID           | P   | Requirement                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------ | --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-DATA-001 | M   | Stored state is versioned (`schemaVersion`, `revision`) and validated when read. If it can't be read, the app falls back to defaults, saves the raw data into one of **3 rotating backups**, and the options page shows a recoverable error (download the backup, or restore defaults).                                                                                                        |
| REQ-DATA-002 | M   | One migration pipeline (`migrate(unknown)`) is used for both storage and imports. Each version step is unit-tested against a fixture (`tests/fixtures/state/vN.json`).                                                                                                                                                                                                                         |
| REQ-DATA-003 | M   | **Export:** pretty-printed JSON named `sitemark-export-YYYY-MM-DD.json` (local date), containing `format`, `schemaVersion`, `appVersion`, `exportedAt` (UTC ISO), `siteGroups` and `settings`. It is only a local download, with a one-line warning that exports contain internal hostnames.                                                                                                   |
| REQ-DATA-004 | M   | **Import:** a file ≤ 1 MB is validated with strict schemas (unknown keys rejected, limits enforced) and migrated if it's older. A preview shows _N updated, M new, K new origins_, with regex patterns highlighted. **Merge** updates or adds groups by ID and keeps the local settings (D-218). **Replace** requires confirmation. An invalid file shows readable errors and changes nothing. |
| REQ-DATA-005 | M   | After an import, all new origins are requested in **one** permission prompt.                                                                                                                                                                                                                                                                                                                   |
| REQ-DATA-006 | C   | Export a single site group.                                                                                                                                                                                                                                                                                                                                                                    |
| REQ-DATA-007 | M   | **Data from a newer version** (after a downgrade, or on an older build): the app opens **read-only**, with a banner and a toolbar badge. Every write is refused, so the data is never destroyed.                                                                                                                                                                                               |

### 5.8 Popup — `POP`

| ID          | P   | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------- | --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-POP-001 | M   | Shows the current origin and every site group whose patterns match it, each with a color chip and name. **Disabled** groups are listed as "Disabled — enable in settings", with a link. When nothing matches: "No site group matches this site" plus **Mark this site**. There is no global on/off switch here (D-204).                                                                                                                      |
| REQ-POP-002 | M   | For each element mark in an active group: status **found** or **not found**, with **Re-pick** when not found. It also shows "favicon tint unavailable" when that applies.                                                                                                                                                                                                                                                                    |
| REQ-POP-003 | M   | Actions: **Pick element**, **Hide on this tab** (a toggle; the popup shows the `toggle-hide` shortcut if one is assigned), and **Settings**.                                                                                                                                                                                                                                                                                                 |
| REQ-POP-004 | M   | If a matching pattern's origin isn't granted: an explanation ("SiteMark needs access to `<host>` to show your marks on every visit") plus **Allow**.                                                                                                                                                                                                                                                                                         |
| REQ-POP-005 | M   | On pages where scripts can't run, it shows "SiteMark can't run on this page" and disables picking. A failed `executeScript` is the ground truth; a list of known URLs is only a hint.                                                                                                                                                                                                                                                        |
| REQ-POP-006 | M   | **Mark this site** (D-201) creates a group named after the host, with the pattern `*://<host[:port]>/*` (exact host; `www.` is not stripped) and one blue page ribbon showing the host (cut to 16 characters). The group goes at the bottom of the list, and the permission is requested. If the user denies it, the group still exists in the "Not granted — Allow" state, and the ribbon shows on this tab through activeTab until reload. |
| REQ-POP-007 | M   | **Toolbar badge** (D-219): a "!" on any tab where an active group can't fully render (element missing, favicon unavailable, read-only data). It clears once resolved. Limitation: a missing permission is only visible when the popup is opened, because there is no `tabs` permission.                                                                                                                                                      |

### 5.9 Options page — `OPT`

| ID          | P   | Requirement                                                                                                                                                                                                                                                               |
| ----------- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-OPT-001 | M   | Layout: a site group list (sidebar) and an editor pane. Hash routing for deep links (`#/groups/:id`, `#/groups/:id/marks/:markId`, `#/settings`, `#/data`, `#/welcome`). **On install**, a welcome tab opens with 3 steps, a "pin SiteMark" hint and the actual shortcut. |
| REQ-OPT-002 | M   | Site group editor: name, enabled, patterns (added with an explicit **Add**; wildcard or regex, inline validation, permission status, live tester), excludes, and the list of marks.                                                                                       |
| REQ-OPT-003 | M   | Mark editor: target (page, or element with a selector input that checks syntax), color presets and custom color, text color, effect toggles with their settings (only the effects valid for the target), and a live preview (REQ-MARK-013).                               |
| REQ-OPT-004 | M   | Settings: theme (System / Light / Dark). Keyboard shortcuts read from `commands.getAll()`, with an **unassigned** state and a button that opens the browser's shortcut settings. Help text about the title prefix and browser history.                                    |
| REQ-OPT-005 | M   | Data: export, import (REQ-DATA-003/004), and **Reset everything**. Reset needs a double confirmation, can optionally revoke all origins, and unregisters the content scripts.                                                                                             |
| REQ-OPT-006 | M   | Autosave (debounced commands) with a subtle "Saved" status. Patterns are the exception: they require Add. An invalid field blocks only itself.                                                                                                                            |
| REQ-OPT-007 | M   | **Copy diagnostics:** copies the version, browser, grant states and mark statuses (no URLs beyond origins) for GitHub issues. It only goes to the local clipboard.                                                                                                        |

### 5.10 Commands — `CMD`

| ID          | P   | Requirement                                                                                                                                                                                                                                                           |
| ----------- | --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-CMD-001 | M   | `start-picker`, suggested key `Alt+Shift+M`, remappable where the browser allows. UI hints show the live key binding. On pages where it can't run, the shortcut briefly shows a "✕" badge. Where `onCommand.tab` is missing, the active tab is looked up another way. |
| REQ-CMD-002 | M   | `toggle-hide` (D-208): no default key. Toggles REQ-RND-008 on the active tab.                                                                                                                                                                                         |

### 5.11 Theme — `THEME`

| ID            | P   | Requirement                                                                                                                             |
| ------------- | --- | --------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-THEME-001 | M   | The popup, options page and in-page picker panel follow the OS color scheme by default. A light or dark override is stored in settings. |
| REQ-THEME-002 | M   | All colors come from the design tokens in `src/styles/tokens.css`. Components contain no hard-coded colors (enforced by stylelint).     |

### 5.12 Internationalization — `I18N`

| ID           | P   | Requirement                                                                                                                                                                                                                                            |
| ------------ | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| REQ-I18N-001 | M   | Every UI string exists in both `en` and `nl` (`public/_locales`), with the same keys, no empty messages and the same placeholders.                                                                                                                     |
| REQ-I18N-002 | M   | Components contain no hard-coded user-facing strings (enforced by a lint rule).                                                                                                                                                                        |
| REQ-I18N-003 | M   | User content (group names, mark texts) is never translated.                                                                                                                                                                                            |
| REQ-I18N-004 | M   | Plurals use `Intl.PluralRules` with `_one`/`_other` keys. `lang` and `dir` are set on `<html>` from the resolved locale. Placeholders are named and have translator descriptions. A pseudo-locale test with +40 % text length guards against overflow. |
| REQ-I18N-005 | M   | Store texts stay within store limits (Chrome description ≤ 132 characters), tested for every locale.                                                                                                                                                   |

### 5.13 Accessibility — `A11Y`

| ID           | P   | Requirement                                                                                                                                                 |
| ------------ | --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-A11Y-001 | M   | WCAG 2.2 AA text contrast in both themes, enforced by a token contrast test.                                                                                |
| REQ-A11Y-002 | M   | Everything works from the keyboard, including the picker (REQ-PICK-002) and reordering (REQ-GRP-004).                                                       |
| REQ-A11Y-003 | M   | Every interactive element has a visible focus indicator (`outline`, token `--sm-focus-color`).                                                              |
| REQ-A11Y-004 | M   | Automated axe checks: vitest-axe in component tests, and Playwright axe on the popup and options page in light and dark (0 serious or critical violations). |
| REQ-A11Y-005 | M   | `prefers-reduced-motion` turns off pulses, fades and slides.                                                                                                |
| REQ-A11Y-006 | M   | The page banner exposes its text to assistive technology (`role="note"`). Purely decorative overlays are `aria-hidden`.                                     |
| REQ-A11Y-007 | M   | **Forced colors** (`forced-colors: active`): the UI uses system colors for boundaries, states and focus, and marks use `forced-color-adjust: none`.         |
| REQ-A11Y-008 | M   | **Non-text contrast** of at least 3:1 for control boundaries and states (WCAG 1.4.11), using `--sm-control-border`.                                         |
| REQ-A11Y-009 | M   | Targets are at least 24 × 24 px (WCAG 2.5.8). Color swatches are 28 px with an 8 px gap.                                                                    |
| REQ-A11Y-010 | M   | Every drag interaction has a non-drag alternative (WCAG 2.5.7): Move up/down buttons for reordering, and a "Move panel" button for the picker panel.        |
| REQ-A11Y-011 | M   | The picker announces the current candidate through a live region (e.g. "button, Delete, 120 by 36") and returns focus when it exits.                        |
| REQ-A11Y-012 | M   | The options page works at 200 % zoom and reflows at 320 px width. The popup scrolls vertically.                                                             |

### 5.14 Security — `SEC`

| ID          | P   | Requirement                                                                                                                                                                                                                                                                                                                                                             |
| ----------- | --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-SEC-001 | M   | **Single writer** (D-220): only the background writes to storage, through a serialized command queue. Content scripts send narrow **intents** (`savePick`, `requestGrant`, `openOptions`, `reportStatus`). The background takes the origin and URL from `sender`, never from the payload.                                                                               |
| REQ-SEC-002 | M   | **Need-to-know** (D-221): a content script only receives the render plan for its own URL. Where the API exists, storage access is restricted to trusted contexts.                                                                                                                                                                                                       |
| REQ-SEC-003 | M   | **Message validation:** only the background registers `runtime.onMessage`. It checks `sender.id` and the sender type (extension page or top-frame content script), and validates payloads with zod. Responses from content scripts are validated too. No `onMessageExternal`, an empty `externally_connectable`, and no `window.postMessage`.                           |
| REQ-SEC-004 | M   | **Hardening against untrusted input** (in storage and imports): strict schemas; limits (REQ-GRP-002; patterns ≤ 500 characters, selectors ≤ 500, origins ≤ 20); IDs match `^[A-Za-z0-9_-]{12}$`; control, format and bidi characters are stripped from user text; merges can't pollute object prototypes; `JSON.parse` errors (including excessive nesting) are caught. |
| REQ-SEC-005 | M   | **Panel trust:** picker and panel handlers require `isTrusted` events and ignore any activation within 500 ms of the panel appearing or moving. Panel actions are low-impact: no pattern input and no permission calls. Documented: the page can observe what is typed into the in-page panel.                                                                          |
| REQ-SEC-006 | M   | **Resilience against hostile pages:** the host element is referenced from a closure and never looked up in the DOM. `:host` rules are `!important`. Re-attaching and moving the host back to the top are rate-limited (≤ 10 per 10 s). The "already injected" guard is a variable in the isolated world.                                                                |
| REQ-SEC-007 | M   | **Page CSP compatibility:** marks render on sites with a strict CSP (`style-src 'self'`) and Trusted Types, via `adoptedStyleSheets` with a `<style>` fallback (D-232).                                                                                                                                                                                                 |
| REQ-SEC-008 | M   | **Release integrity:** CI checks the manifest in every release zip (REQ-PRIV-001, no e2e hosts). Artifacts get build-provenance attestations and SHA256SUMS. The Firefox build is reproducible from `SOURCE_REVIEW.md`.                                                                                                                                                 |
| REQ-SEC-009 | M   | **Supply chain** (D-238): GitHub Actions pinned by SHA; jobs with minimal permissions and timeouts; a frozen lockfile; pnpm policies for build scripts and release age; a Dependabot cooldown; store secrets only in the `store` environment, which requires reviewer approval.                                                                                         |
| REQ-SEC-010 | M   | `SECURITY.md` documents the threat model, the non-goals (D-239) and how to report a vulnerability.                                                                                                                                                                                                                                                                      |

### 5.15 Environment behaviour — `ENV`

| ID          | P   | Requirement                                                                                                                                                                     |
| ----------- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-ENV-001 | M   | Top frame only (`allFrames: false`, `matchAboutBlank: false`). Pages inside iframes aren't marked. For picking inside iframes, see REQ-PICK-008.                                |
| REQ-ENV-002 | M   | Private windows use the same site groups, but only if the user allowed the extension there in the browser settings. Safari applies grants across profiles and private browsing. |
| REQ-ENV-003 | M   | `file://` URLs, the browser's PDF viewer, store pages and browser-internal pages are not supported (REQ-POP-005).                                                               |

## 6. Non-functional requirements — `NFR`

| ID          | P   | Requirement                                                                                                                                                                                                                                                                          |
| ----------- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| REQ-NFR-001 | M   | **Compatibility** (D-241): Chrome/Edge ≥ 120 (Brave, Opera and Arc best-effort) and Firefox desktop ≥ 140. Safari on macOS ≥ 18 in v1.1. One codebase, with browser quirks isolated in `src/platform/`. The minimum versions are declared in the manifest.                           |
| REQ-NFR-002 | M   | **Size:** the marker content script is ≤ 25 KB gzipped and the picker ≤ 20 KB gzipped (no React in content scripts). Checked in CI.                                                                                                                                                  |
| REQ-NFR-003 | M   | **Performance:** with no active group, the content script finishes in < 2 ms. Matching 500 patterns takes < 1 ms. With 10 element marks, scrolling costs < 1 ms per frame on average. Marks are visible ≤ 100 ms after `DOMContentLoaded`.                                           |
| REQ-NFR-004 | M   | **Quality gates** that must pass in CI before merge: typecheck, lint (Biome, with layer zones and type-aware rules), format, stylelint, unit/dom/browser tests with coverage (core ≥ 90 % lines and 85 % branches, platform ≥ 85 %, overall ≥ 80 %), e2e, verify-tdd and commitlint. |
| REQ-NFR-005 | M   | **Security:** no `eval` or `new Function` in the built output (zod `jitless`), no remote code, a strict CSP, and all untrusted input validated.                                                                                                                                      |
| REQ-NFR-006 | M   | **Store readiness:** `wxt zip` produces packages for the Chrome Web Store, Edge Add-ons and Firefox AMO, plus the AMO source zip. Store listings in en and nl, permission justifications, screenshots and a promo tile. Automated submission behind the `store` environment (D-227). |

## 7. Data model (normative)

```ts
type Brand<T, B extends string> = T & { readonly __brand: B };
type SiteGroupId = Brand<string, 'SiteGroupId'>; // 12 chars [A-Za-z0-9_-], minted by background
type MarkId = Brand<string, 'MarkId'>;
type PatternId = Brand<string, 'PatternId'>;
type Hex = Brand<string, 'Hex'>; // /^#[0-9a-f]{6}$/ (lowercased on input)
type OriginPattern = Brand<string, 'OriginPattern'>; // ^(\*|https?)://(\*\.)?host/\*$, canonical (no port), never broad

interface SiteMarkState {
  schemaVersion: 1;
  revision: number; // +1 per applied command
  siteGroups: SiteGroup[]; // ≤ 200, order = priority (index 0 = highest)
  settings: { theme: 'system' | 'light' | 'dark' };
}

interface SiteGroup {
  id: SiteGroupId;
  name: string; // 1..40, control chars stripped
  enabled: boolean; // true ⇒ patterns.length ≥ 1
  patterns: UrlPattern[]; // 0..50
  excludes: UrlPattern[]; // 0..50 (REQ-URL-008)
  marks: Mark[]; // 0..50
}

type UrlPattern =
  | { id: PatternId; kind: 'wildcard'; value: string } // ≤ 500 chars, ≤ 10 '*'
  | { id: PatternId; kind: 'regex'; value: string; origins: OriginPattern[] }; // safe subset, 1..20 origins

type Mark = PageMark | ElementMark;

interface MarkBase {
  id: MarkId;
  label?: string; // ≤ 40, shown in the UI only
  enabled: boolean;
  color: Hex;
  textColor: 'auto' | Hex;
}
interface PageMark extends MarkBase {
  target: { kind: 'page' };
  effects: PageEffects; // ≥ 1 key
}
interface ElementMark extends MarkBase {
  target: { kind: 'element'; selector: string }; // 1..500, first match
  effects: ElementEffects; // ≥ 1 key
}

type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
interface Ribbon {
  text: string; // 1..16
  corner: Corner;
}

interface PageEffects {
  ribbon?: Ribbon;
  banner?: { text: string /* 1..60 */; edge: 'top' | 'bottom'; size: 'compact' | 'regular' };
  frame?: { widthPx: number /* 2..16 */ };
  tint?: { opacityPct: number /* 3..15 */ };
  stripes?: { opacityPct: number /* 5..40 */; area: 'edge' | 'full' };
  watermark?: { text: string /* 1..24 */; opacityPct: number /* 4..12 */ };
  titlePrefix?: { text: string /* 1..16 */ };
  favicon?: Record<string, never>; // presence = on
}
interface ElementEffects {
  ribbon?: Ribbon;
  outline?: { widthPx: number /* 1..8 */; style: 'solid' | 'dashed' | 'dotted'; pulse: boolean };
  tint?: { opacityPct: number /* 5..40 */ };
  stripes?: { opacityPct: number /* 5..40 */ };
}
```

The zod schemas use `.strict()`, so unknown keys are rejected. Export envelope:
`{ "format": "sitemark-export", "schemaVersion": 1, "appVersion": "x.y.z", "exportedAt": ISO, "siteGroups": [...], "settings": {...} }`.

## 8. Key flows

1. **Install:** no permission warnings. A welcome tab opens (3 steps, a pin hint, the shortcut).
2. **Mark this site** (popup): clicking **Mark this site** immediately shows the permission prompt (the request is synchronous) while a command creates the group. On grant, the background syncs registration and injects the marker, and a blue ribbon with the host name appears. On deny, the group shows "Not granted — Allow".
3. **Pick element:** from the popup or with `Alt+Shift+M`, the glass pane opens. The user hovers or uses the keyboard, then selects. In the mini panel, Save sends a `savePick` intent and the overlay appears. If the origin isn't granted, Allow opens the grant page.
4. **Fine-tune:** options → site group → mark editor → live preview. Autosave sends commands, and updated render plans reach open tabs within 250 ms.
5. **New laptop:** options → Data → Export. On the new device: Import → preview (N updated, M new) → Merge → one permission prompt.

## 9. Later (not in v1)

An environment preset chooser with hostname guessing; per-mark URL path filters; site group
search and filtering; starter templates; an in-app language override; more languages; mobile
(Firefox Android, Safari iOS); optional encrypted sync; automated e2e for Firefox and Safari.
