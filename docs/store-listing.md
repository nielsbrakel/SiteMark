# Store listings

The fields every store listing shares (D-256). T-152 writes the listing texts, permission justifications and
screenshots and fills in the rest; T-157 does the same for the App Store. Everything that points to the web
uses the **website**, never the repository, so the URLs stay stable (REQ-POLICY-005).

## Website, privacy and support URLs

| Field                          | English                                         | Dutch                                              |
| ------------------------------ | ----------------------------------------------- | -------------------------------------------------- |
| Website / homepage             | https://nielsbrakel.github.io/SiteMark/         | https://nielsbrakel.github.io/SiteMark/nl/         |
| Privacy policy                 | https://nielsbrakel.github.io/SiteMark/privacy/ | https://nielsbrakel.github.io/SiteMark/nl/privacy/ |
| Support (App Store, AMO, Edge) | https://nielsbrakel.github.io/SiteMark/support/ | https://nielsbrakel.github.io/SiteMark/nl/support/ |

Stores that take a single URL per field get the English one: every page links its Dutch version.

## Per store

| Store                  | Website field   | Privacy field                  | Support field            | Status  |
| ---------------------- | --------------- | ------------------------------ | ------------------------ | ------- |
| Chrome Web Store       | _Homepage URL_  | _Privacy policy URL_           | _Support URL_            | T-152 ☐ |
| Microsoft Edge Add-ons | _Website_       | _Privacy policy URL_           | _Support contact_        | T-152 ☐ |
| Firefox Add-ons (AMO)  | _Homepage_      | _Privacy policy_ (text or URL) | _Support website_        | T-152 ☐ |
| App Store (Safari)     | _Marketing URL_ | _Privacy Policy URL_           | _Support URL_ (required) | T-157 ☐ |

When a listing goes live, put its URL in [`website/src/config/stores.ts`](../website/src/config/stores.ts):
the website's install button for that store then turns from "Coming soon" into a link (REQ-PAGE-002).

## Listing texts

Name: **SiteMark** (all stores, both languages). Category: _Developer Tools_ (Chrome, Edge), _Other_ /
_Web Development_ (AMO).

### Short description (≤ 132 characters)

- **en:** Mark production and test sites with ribbons, banners and outlines, so you never mix them up. Private:
  nothing leaves your browser.
- **nl:** Markeer productie- en testsites met linten, banners en kaders, zodat je ze nooit verwart. Privé: niets
  verlaat je browser.

### Long description

**en**

> Ever changed something on production while you thought you were on test? SiteMark makes the difference
> impossible to miss.
>
> - **Site groups:** group the sites that belong together (say "Production") with URL patterns, from simple
>   wildcards like `*.example.com` to careful regular expressions.
> - **Marks on the page:** a corner ribbon, a banner, a frame around the window, a tint, stripes or a
>   watermark, in the color you choose.
> - **Marks on elements:** pick the button that deletes customers and give it an outline or a ribbon. The mark
>   follows the element while you scroll.
> - **In the tab bar too:** an optional title prefix and a tinted favicon.
> - **Hide on this tab** when you need a clean screenshot, with an optional keyboard shortcut.
> - **Private by design:** SiteMark asks for access per website, only when you add it, and runs nowhere else.
>   No accounts, no analytics, no servers; your settings stay in your browser. Export and import them as a
>   file.
> - Keyboard friendly, light and dark, in English and Dutch. Open source (MIT).

**nl**

> Ooit iets op productie aangepast terwijl je dacht dat je op test zat? Met SiteMark zie je het verschil
> meteen.
>
> - **Sitegroepen:** groepeer de sites die bij elkaar horen (bijvoorbeeld "Productie") met URL-patronen, van
>   eenvoudige jokertekens zoals `*.example.com` tot zorgvuldige reguliere expressies.
> - **Markeringen op de pagina:** een lint in de hoek, een banner, een kader rond het venster, een tint, strepen
>   of een watermerk, in de kleur die jij kiest.
> - **Markeringen op elementen:** kies de knop waarmee je klanten verwijdert en geef hem een kader of een lint.
>   De markering volgt het element terwijl je scrolt.
> - **Ook in de tabbalk:** een optioneel voorvoegsel in de titel en een gekleurd favicon.
> - **Verbergen op dit tabblad** voor een schone schermafbeelding, met een optionele sneltoets.
> - **Privé als uitgangspunt:** SiteMark vraagt per website om toegang, alleen als je die toevoegt, en draait
>   nergens anders. Geen accounts, geen analytics, geen servers; je instellingen blijven in je browser. Exporteer
>   en importeer ze als bestand.
> - Goed met het toetsenbord te bedienen, licht en donker, in het Engels en Nederlands. Open source (MIT).

## Single purpose (Chrome Web Store)

> SiteMark visually marks the websites the user chooses (for example production environments) so they can't be
> confused with other environments.

## Permission justifications

Matching [PRIVACY.md](../PRIVACY.md#permissions-and-why-sitemark-needs-them).

| Permission                       | Justification                                                                                                                                                                                                    |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `storage`                        | Keeps the user's site groups, URL patterns, marks and settings in `storage.local`. Nothing is synced or sent anywhere.                                                                                           |
| `scripting`                      | Registers the marker content script for the websites the user granted, so marks appear on every visit, and injects the element picker when the user asks for it.                                                 |
| `activeTab`                      | Lets the user pick an element or mark the current site from the toolbar button or shortcut, on the tab they are using, without broad host access.                                                                |
| Optional host access (`*://*/*`) | Never granted at install. When the user adds a URL pattern, SiteMark requests that website only; the marker runs only on websites the user granted. It reads a page only to find picked elements and draw marks. |
| Remote code                      | None. All code is in the package; no `eval`, no remote scripts, no network requests.                                                                                                                             |

## Data-use disclosures

- **Collected data:** none (Chrome: no data types checked; Edge and AMO: "does not collect or transmit data").
- SiteMark has no servers, accounts, analytics, crash reporting or advertising, and sells or shares nothing
  (REQ-PRIV-005).
- The Chrome "limited use" certifications all apply trivially: no user data is transferred.

## Images

All images are generated, never made by hand (D-251): `pnpm web:screenshots` writes the screenshots and
`pnpm icons` the icons and the promo tile.

| Image                           | Size       | Files                                                                             |
| ------------------------------- | ---------- | --------------------------------------------------------------------------------- |
| Store icon                      | 128 × 128  | `public/icon/128.png` (also in the package)                                       |
| Screenshots (Chrome, Edge, AMO) | 1280 × 800 | `website/public/screenshots/{marked-page,popup,options}-{light,dark}-{en,nl}.png` |
| Small promo tile (Chrome, Edge) | 440 × 280  | `design/promo-tile.png` (from `design/promo-tile.svg`)                            |

Upload the three light screenshots first (the marked page, the popup, then the options page) and the dark
ones after them, in the listing's language: `-en` for English and `-nl` for Dutch. The promo tile is English
only and serves the Dutch listing too. The Chrome marquee tile (1400 × 560) is optional and not made.
