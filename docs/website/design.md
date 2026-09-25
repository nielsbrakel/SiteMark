# SiteMark website — Design

> Builds on the extension [design](../design.md): the same tokens ([`src/styles/tokens.css`](../../src/styles/tokens.css)),
> primitives ([`src/styles/base.css`](../../src/styles/base.css)) and logo ([`design/logo/`](../../design/logo)).
> This page only adds what a public website needs. Anything not covered here follows the extension design.

## 1. Principles

1. **Same product, bigger canvas.** The website uses the extension's calm neumorphic chrome, coral accent and
   system rounded type. A visitor who installs SiteMark should recognize the popup from the website.
2. **Show the marks.** As in the extension, the chrome is quiet and the marks are loud. The hero and the
   playground show real marks from the real marker code (D-254).
3. **Accessible soft UI**, unchanged: AA text contrast, 3:1 control boundaries, an `outline` focus ring, state
   shown by more than shadow, forced-colors support.
4. **No network.** System fonts only, inline SVG icons, images self-hosted (REQ-WEB-003).
5. **Reading first.** Privacy, support and help are long text, so prose gets a comfortable measure and rhythm.

## 2. Website tokens (`website/src/styles/website-tokens.css`)

These are only sizes and layout. **Colors, shadows and radii always come from `tokens.css`** (stylelint enforces this).

| Token               | Value                    | Use                                       |
| ------------------- | ------------------------ | ----------------------------------------- |
| `--smw-page-max`    | `1120px`                 | Home and playground content width         |
| `--smw-prose-max`   | `68ch`                   | Privacy, support, help and changelog text |
| `--smw-gutter`      | `clamp(16px, 4vw, 32px)` | Page side padding                         |
| `--smw-section-gap` | `clamp(48px, 8vw, 96px)` | Space between home sections               |
| `--smw-text-2xl`    | `28px`                   | Page titles (= the options title size)    |
| `--smw-text-3xl`    | `clamp(32px, 5vw, 48px)` | Home `<h1>` only                          |
| `--smw-prose-line`  | `1.6`                    | Prose line height                         |

The type scale continues the extension scale (12/14/16/20/28) and only adds the hero size. Body prose uses
16 px (`--sm-text-lg`), UI chrome uses 14 px, and the minimum stays 12 px.

## 3. Layout

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ [skip link]                                                                  │
│ ▣ SiteMark      Help  Playground  Support  Privacy        [EN|NL] [◐ auto]   │  header: flat surface, bottom --sm-border
├──────────────────────────────────────────────────────────────────────────────┤
│  Never confuse production with test again.          ┌─ mock browser ───────┐ │
│  One sentence value proposition.                     │ ◤PROD      prod.… ✕ │ │  hero: text left, preview right
│  [Add to Chrome] [Firefox] [Edge] [Safari · v1.1]    │ ▔▔▔▔▔ banner ▔▔▔▔▔▔ │ │  (stacks below 720 px)
│                                                      └──────────────────────┘ │
│  ┌ card ────────┐ ┌ card ────────┐ ┌ card ────────┐                            │  highlights: 3 raised cards
│  │ Unmistakable │ │ Simple       │ │ Private      │                            │
│  └──────────────┘ └──────────────┘ └──────────────┘                            │
│  Screenshots (W2) · Privacy summary → /privacy/                                │
├──────────────────────────────────────────────────────────────────────────────┤
│ GitHub · Changelog · Privacy · Support · Sitemap · MIT license                 │  footer: muted text
└──────────────────────────────────────────────────────────────────────────────┘
```

- **Breakpoints:** 720 px (the hero stacks, the nav wraps into two rows; no hamburger menu, so no JS is needed for navigation)
  and 320 px (REQ-WEBUX-005 reflow).
- **Prose pages** (privacy, support, help, changelog): one centered column at `--smw-prose-max`. Help adds a
  topic list above the text on narrow screens and in a sidebar at ≥ 960 px.
- **Surfaces:** the page background is `--sm-bg`. Neumorphic `--sm-raised` is only for cards, the hero preview
  and the playground panel (not for body text blocks), so long pages stay flat and readable.

## 4. Components

Reused from `src/ui/components` where one exists (button, segmented control, swatch, card, mock-browser preview).
Website-only components live in `website/src/components` with CSS Modules.

| Component        | Notes                                                                                                                             |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `Header`         | The wordmark (light/dark SVG variant chosen by CSS), nav links with `aria-current="page"`, `LanguageSwitch`, `ThemeToggle`        |
| `LanguageSwitch` | Two links (`EN` / `NL`) with `hreflang` and `lang`. The current one is `aria-current` and uses `--sm-pressed`                     |
| `ThemeToggle`    | The extension's segmented control: Auto / Light / Dark. Without JS it's hidden (`[data-js]` on `<html>`), and the OS decides      |
| `InstallButtons` | Primary accent buttons per store with an inline SVG store icon + text. Coming-soon stores render as disabled buttons with a label |
| `Prose`          | Markdown output: heading anchors, link underline, code in `--sm-font-mono` inside `--sm-inset` wells, tables with `--sm-border`   |
| `Callout`        | A note or warning box (for example "Security issue? Don't open a public issue"), with an icon + text, never color alone           |
| `FeatureCard`    | A raised card with an inline SVG icon, a title and one sentence                                                                   |
| `MockBrowser`    | From `src/ui/components` (T-135): tab strip, address bar, content area, marker-view host                                          |
| `Footer`         | Muted links; the MIT license and the "made in the Netherlands" controller line from the privacy page                              |

Every component defines the states matrix from the extension design (§4a): default, hover, focus-visible, active,
disabled, forced colors, light and dark.

## 5. Imagery

- **Logo:** `sitemark-wordmark.svg` / `sitemark-wordmark-dark.svg` in the header. The favicon is the 32 px PNG and the icon SVG.
- **Screenshots** (W2, D-251): generated, 2× density, WebP with PNG fallback, in the same framing as the store
  images. Each has a real `alt` text from the catalog (what the screenshot shows, not "screenshot").
- **Social preview:** `design/social-preview.png` (1280 × 640), shared with the repository.
- **Icons:** inline SVG with `currentColor`, `aria-hidden` when next to text.

## 6. Motion

The extension motion tokens (`--sm-duration`, `--sm-ease`) are used only for hover and press feedback and for the
playground's mark changes. There is no scroll-triggered animation, and `prefers-reduced-motion` turns all of it off.
