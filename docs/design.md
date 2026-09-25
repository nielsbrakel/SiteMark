# SiteMark — Design

> Tokens: [`src/styles/tokens.css`](../src/styles/tokens.css) · Primitives: [`src/styles/base.css`](../src/styles/base.css) · Logo: [`design/logo/`](../design/logo)

## 1. Principles

1. **Soft chrome, loud marks.** The extension UI is calm neumorphic grey. The marks it
   puts on websites are loud and saturated. The two never look alike.
2. **Accessible soft UI.** Neumorphism on its own fails contrast and focus requirements. So we
   always use real text contrast (AA), a visible focus ring, and never rely on shadow alone to
   show state (a toggle also changes color and label).
3. **One glance.** Popup status is readable without hunting: color chip + profile name + switch.
4. **No network.** System fonts only. Icons are inline SVG. Nothing is loaded from a CDN.

## 2. Brand

### Logo

| Asset                                 | Use                                                     |
| ------------------------------------- | ------------------------------------------------------- |
| `design/logo/sitemark-icon.svg`       | Master icon (48–512 px, store tile, options header)     |
| `design/logo/sitemark-icon-small.svg` | Toolbar 16/32 px. Flat, no soft shadows, thicker cursor |
| `design/logo/sitemark-wordmark.svg`   | README, store promo, welcome screen                     |
| `public/icon/{16,32,48,96,128}.png`   | Generated with `pnpm icons` (don't edit by hand)        |

**Concept:** a coral **bookmark ribbon** (the _Mark_) on a raised soft tile (the _Site_),
with a **pointer cursor** (the picker) overlapping the ribbon's notch.

**Rules:** keep clear space of ¼ of the icon width around it. Don't recolor the ribbon except
for the monochrome version (`currentColor`, for future use). Don't add the soft
shadows below 48 px. In the wordmark, "Site" uses `--sm-text` and "Mark" uses `--sm-brand-coral`.

### Color

| Token                    | Light     | Dark      | Use                                     |
| ------------------------ | --------- | --------- | --------------------------------------- |
| `--sm-bg`/`--sm-surface` | `#e6e9ef` | `#23262d` | Everything (neumorphism = same surface) |
| `--sm-text`              | `#2b2f38` | `#e7e9ee` | Body text (11.0 : 1 / 12.5 : 1)         |
| `--sm-text-muted`        | `#555c6a` | `#a3a9b6` | Secondary text (5.5 : 1 / 6.4 : 1)      |
| `--sm-accent`            | `#c93a2e` | `#ff7a6b` | Primary buttons, active switches        |
| `--sm-on-accent`         | `#ffffff` | `#1b1d22` | Text on accent (5.1 : 1 / 6.6 : 1)      |
| `--sm-accent-text`       | `#b83227` | `#ff8a7d` | Accent text/links, focus ring           |
| `--sm-brand-coral`       | `#e5483b` | —         | Logo only (decorative)                  |

**Mark presets** (the loud colors, REQ-MARK-012):

| Preset     | Hex       | Default text (auto) | Suggested use      |
| ---------- | --------- | ------------------- | ------------------ |
| Production | `#c93a2e` | white               | prod               |
| Staging    | `#f4a300` | black               | acceptance/staging |
| Test       | `#6b4eff` | white               | test/QA            |
| Local      | `#1a7f37` | white               | localhost/dev      |
| Info       | `#1f6feb` | white               | anything else      |

## 3. Elevation (the neumorphic core)

| Token            | Recipe                                 | Used for                                  |
| ---------------- | -------------------------------------- | ----------------------------------------- |
| `--sm-raised`    | 6/6/12 dark + −6/−6/12 light           | Cards, the popup's status card            |
| `--sm-raised-sm` | 3/3/6 dark + −3/−3/6 light             | Buttons, chips, switch knob               |
| `--sm-inset`     | inset 3/3/6 dark + inset −3/−3/6 light | Inputs, wells, switch track, segmented bg |
| `--sm-pressed`   | inset 2/2/4                            | Active/pressed buttons, selected segment  |

Radii: 8 (chips, inputs) · 12 (buttons, wells) · 20 (cards) · pill (switches, tags).
Spacing: 4-px grid (`--sm-space-1..6` = 4, 8, 12, 16, 24, 32).
Type: system rounded stack, 11/12/14/16/20 px (28 px options page title). Weights 400/600/700.

## 4. Components (`src/ui/components`)

| Component  | Anatomy / behavior                                                                                               |
| ---------- | ---------------------------------------------------------------------------------------------------------------- |
| Button     | raised-sm, pressed on `:active`. `primary` = accent fill. Icon + label. Min target 32 × 32 (popup), 36 (options) |
| IconButton | 32 × 32 round, raised-sm, **must** have `aria-label`                                                             |
| Switch     | Inset pill track, raised knob. On = accent track + knob right + "On" (sr-only). `role="switch"`                  |
| Card       | raised, radius 20, padding 16                                                                                    |
| Field      | label above, inset input, helper/error text below (`aria-describedby`). Error = danger text + icon               |
| Segmented  | inset container, selected segment raised-sm (radio group semantics)                                              |
| Slider     | inset track, raised thumb, value bubble                                                                          |
| ColorField | 5 preset swatches (raised circles with a check when selected), custom hex input, native picker button            |
| Dialog     | raised card over a 40 % scrim, focus trapped, Esc closes                                                         |
| Toast      | bottom center, raised, auto-dismiss 4 s, action button (Undo)                                                    |
| ColorChip  | 12 px circle in the mark color with a 1 px `--sm-border` ring (visible on any bg)                                |

## 5. Screens

### 5.1 Popup (360 px wide)

**A. Site matches**

```text
┌────────────────────────────────────────┐
│ [logo] SiteMark                 [⚙]    │
│ app.example.com                         │
│ ╭────────────────────────────────────╮ │  ← raised status card
│ │ ● Production              [●━━ On] │ │
│ │   ▸ Page ribbon  PRODUCTION        │ │
│ │   ▸ Delete button   ✓ found        │ │
│ │   ▸ Price table     ⚠ not found  [Re-pick] │
│ │ ● Payments admin          [━━○ Off]│ │
│ ╰────────────────────────────────────╯ │
│ [ ⌖ Pick element ]  [ 👁 Hide on tab ] │  ← raised buttons; Hide toggles pressed
│ Alt+Shift+M to pick                    │  ← muted hint
└────────────────────────────────────────┘
```

**B. No match:** an inset well says "No profile matches this site", with a primary **Mark this site**
button and a secondary "Pick element". **C. Permission missing:** a warning card
"SiteMark needs access to app.example.com to show your marks" with **Allow**.
**D. Restricted page:** muted illustration and "SiteMark can't run on this page", with actions disabled.

### 5.2 Options page (full tab, max 960 px)

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ [logo] SiteMark settings                     Profiles · Settings · Data  │
├───────────────────────┬──────────────────────────────────────────────────┤
│ Profiles        [+]   │  ● Production                         [●━━ On]   │
│ ╭───────────────────╮ │  Name  [ Production            ]                  │
│ │● Production   ●━━ │ │                                                   │
│ ╰───────────────────╯ │  URL patterns                                     │
│  ● Staging     ●━━    │  ┌ https://*.example.com/*     ✓ Granted   [🗑] ┐  │
│  ● Local       ━━○    │  └ regex ^https://admin\.…    ⚠ Allow     [🗑] ┘  │
│   [↑] [↓] reorder     │  [+ Add pattern]   Test URL [ https://…  ] ✓ match│
│                       │                                                   │
│                       │  Marks                                            │
│                       │  ╭ Page · ribbon + banner ───────── [Edit] [⋯] ╮ │
│                       │  ╭ Element · #delete-btn · outline ─ [Edit] [⋯] ╮ │
│                       │  [+ Page mark] [+ Element mark]                   │
└───────────────────────┴──────────────────────────────────────────────────┘
```

**Mark editor** (a drawer on the right, or inline on narrow widths):

```text
Target      (• Page  ○ Element)      Selector [ #delete-btn ] ✓ valid
Color       (●)(●)(●)(●)(●)  [#c93a2e] [🎨]     Text color (• Auto ○ Custom)
Effects     [✓] Ribbon   text [PRODUCTION]  corner (TL|TR|BL|BR)
            [✓] Banner   text [You are on PRODUCTION]  (Top|Bottom) (Compact|Regular)
            [ ] Frame    width ──●──── 6px
            [ ] Stripes  [ ] Watermark  [ ] Tint  [✓] Title prefix [PROD]  [ ] Favicon
Preview     ╭ mock browser window showing the result live ╮
```

### 5.3 Picker

- **Hover:** a 2 px `--sm-mark-blue` outline plus 10 % tint on the hovered element. The tooltip (raised
  pill, follows the cursor, flips at viewport edges) shows `button#delete.btn-danger · 120×36`.
- **Top hint bar** (compact, centered): "Click to select · ↑↓←→ navigate · Enter select · Esc cancel".
- **Mini panel** after selecting (in shadow DOM, uses the same tokens, ~320 px, docked
  bottom-right and draggable):

```text
╭ Mark this element ─────────────────── [×] ╮
│ Selector [ #delete-btn           ] 1 match │
│ Profile  [ Production (matches) ▾ ]        │
│ Style    (Ribbon)(Outline)(Tint)(Stripes)  │
│ Color    (●)(●)(●)(●)(●)                   │
│ [More options…]        [Cancel] [ Save ]   │
╰────────────────────────────────────────────╯
```

## 6. Marker effects (injected — REQ-MARK-*)

All effects live inside `<sitemark-root>`'s closed shadow root, `pointer-events: none`.

| Effect        | Spec                                                                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ribbon (page) | 180 × 32 px band rotated 45° across the chosen corner, bold 12 px uppercase, letter-spacing .08em, 1 px inner highlight line, subtle drop shadow                   |
| Ribbon (elem) | Same, scaled to fit: band height clamp(16 px, 12 % of the element's short side, 28 px). Clipped to the element's box                                               |
| Banner        | compact 24 px / regular 36 px. Mark color, auto text, centered text + small SiteMark glyph left. Chevron at the right collapses it to a 24 × 24 tab. `role="note"` |
| Frame         | Fixed inset box-shadow `inset 0 0 0 Wpx color` over the viewport. Multiple frames nest                                                                             |
| Outline       | Overlay box at target rect +2 px, border W px style; pulse = 1.6 s opacity/scale glow (off with reduced motion)                                                    |
| Tint          | Overlay filled with color at the given opacity (page: full viewport)                                                                                               |
| Stripes       | `repeating-linear-gradient(-45deg, color 0 12px, transparent 12px 24px)`. `edge` = 6 px strip at the top of the viewport, `full` = whole area at the given opacity |
| Watermark     | Tiled SVG background of the rotated (−30°) text, 20 px bold, at the given opacity                                                                                  |
| Title prefix  | `document.title = prefix + ' ' + original`, kept in place by a `<title>` MutationObserver                                                                          |
| Favicon       | 32 px canvas: original favicon + a 12 px dot in the bottom-right in the mark color with a 2 px white ring. CORS fallback: colored rounded square + first letter    |

## 7. Motion

Default 160 ms `cubic-bezier(.2,.8,.2,1)` for press and hover. Toasts and drawers slide 8 px + fade.
Everything goes to 0 ms under `prefers-reduced-motion` (token override in `tokens.css`).

## 8. Theming

`tokens.css` defines the light values on `:root`, dark values under `prefers-color-scheme: dark`
(unless `data-theme="light"`), and a forced dark via `data-theme="dark"`. The popup, options and
picker panel set `data-theme` from settings (REQ-THEME-001). Marks don't follow the theme:
they use the user's mark colors.
