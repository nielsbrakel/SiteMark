# Store listings

The content every store listing shares (D-256), kept here so it is version controlled: copy it into each
store's dashboard. T-152 writes the listing texts, permission justifications and
screenshots and fills in the rest; T-157 does the same for the App Store. Everything that points to the web
uses the **website**, never the repository, so the URLs stay stable (REQ-POLICY-005).

## Website, privacy and support URLs

| Field                          | English                                         | Dutch                                              |
| ------------------------------ | ----------------------------------------------- | -------------------------------------------------- |
| Website / homepage             | https://nielsbrakel.github.io/SiteMark/         | https://nielsbrakel.github.io/SiteMark/nl/         |
| Source code                    | https://github.com/nielsbrakel/SiteMark         | https://github.com/nielsbrakel/SiteMark            |
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

Name: **SiteMark** (all stores, both languages).

| Store                  | Category          | Languages |
| ---------------------- | ----------------- | --------- |
| Chrome Web Store       | _Developer Tools_ | en, nl    |
| Microsoft Edge Add-ons | _Developer tools_ | en, nl    |
| Firefox Add-ons (AMO)  | _Web Development_ | en, nl    |

### Short description (≤ 132 characters)

- **en:** Mark production and test sites with ribbons, banners and outlines, so you never mix them up. Private:
  it collects no data.
- **nl:** Markeer productie- en testsites met linten, banners en kaders, zodat je ze nooit verwart. Privé:
  het verzamelt geen gegevens.

### Long description

Plain paragraphs only: the store dashboards don't format text, so there are no lists, bold or code spans.

**en**

```text
Ever changed something on production while you thought you were on test? SiteMark makes the difference impossible to miss.

Group the sites that belong together, say "Production", with URL patterns, from simple wildcards like *.example.com to careful regular expressions. SiteMark then marks every matching page with a corner ribbon, a banner, a frame around the window, a tint, stripes or a watermark, in the color you choose.

You can also mark a single element: pick the button that deletes customers and give it an outline or a ribbon. The mark follows the element while you scroll. In the tab bar, an optional title prefix and a tinted favicon keep the difference visible there too, and you can hide the marks on one tab when you need a clean screenshot, with an optional keyboard shortcut.

SiteMark is private by design. It asks for access per website, only when you add it, and runs nowhere else. There are no accounts, no analytics and no servers, and your settings stay in your browser. You can export and import them as a file.

It works with the keyboard, in light and dark, in English and Dutch. The source code is public to read; all rights reserved.
```

**nl**

```text
Ooit iets op productie aangepast terwijl je dacht dat je op test zat? Met SiteMark zie je het verschil meteen.

Groepeer de sites die bij elkaar horen, bijvoorbeeld "Productie", met URL-patronen, van eenvoudige jokertekens zoals *.example.com tot zorgvuldige reguliere expressies. SiteMark markeert daarna elke pagina die erbij past met een lint in de hoek, een banner, een kader rond het venster, een tint, strepen of een watermerk, in de kleur die jij kiest.

Je kunt ook één element markeren: kies de knop waarmee je klanten verwijdert en geef hem een kader of een lint. De markering volgt het element terwijl je scrolt. In de tabbalk houden een optioneel voorvoegsel in de titel en een gekleurd favicon het verschil ook zichtbaar, en op één tabblad kun je de markeringen verbergen voor een schone schermafbeelding, met een optionele sneltoets.

SiteMark is privé als uitgangspunt. Het vraagt per website om toegang, alleen als je die toevoegt, en draait nergens anders. Er zijn geen accounts, geen analytics en geen servers, en je instellingen blijven in je browser. Je kunt ze exporteren en importeren als bestand.

Goed met het toetsenbord te bedienen, licht en donker, in het Engels en Nederlands. De broncode is openbaar om te lezen; alle rechten voorbehouden.
```

### Search terms (Edge)

Edge takes up to 7 terms of at most 30 characters each, and at most 21 separate words across all terms.

- **en** (14 words): `production warning`, `environment marker`, `test environment`, `staging banner`, `site ribbon`, `website labels`, `developer tools`
- **nl** (11 words): `productie waarschuwing`, `omgevingsmarkering`, `testomgeving`, `staging banner`, `site lint`, `website markeren`, `ontwikkelaarstools`

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

All images are generated, never made by hand (D-251): `pnpm web:screenshots` writes the website screenshots,
and `pnpm icons` renders the icons and tiles and collects everything in [`images/`](images/).

| File in `images/`                              | Size       | Chrome | Edge | Firefox |
| ---------------------------------------------- | ---------- | :----: | :--: | :-----: |
| `icon-128.png` (store icon)                    | 128 × 128  |   ✓    |      |    ✓    |
| `icon-300.png` (store logo)                    | 300 × 300  |        |  ✓   |         |
| `{en,nl}/1…5-*.png` (screenshots)              | 1280 × 800 |   ✓    |  ✓   |    ✓    |
| `{en,nl}/promo-small-440x280.png` (small tile) | 440 × 280  |   ✓    |  ✓   |         |
| `{en,nl}/promo-marquee-1400x560.png` (marquee) | 1400 × 560 |   ✓    |  ✓   |         |

- Everything in `en/` and `nl/` is localised: screenshots, promo tiles and the captions below. Upload `nl` to the
  Dutch listing and `en` to the English one.
- Screenshots are 24-bit PNG without alpha, numbered in upload order. Chrome allows 5 per language, so `en` and
  `nl` are each a complete set. Chrome's **global** screenshots are the `en` set.
- Firefox has no promo tiles. It takes its icon from the package. The icon PNGs have an alpha channel, which
  stores allow for icons.

### Screenshot captions

| #   | File                  | en                                                                  | nl                                                                  |
| --- | --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 1   | `1-marked-page-light` | A marked page: ribbon and banner make production impossible to miss | Een gemarkeerde pagina: lint en banner maken productie onmiskenbaar |
| 2   | `2-popup-light`       | Mark the current site from the toolbar popup                        | Markeer de huidige site vanuit het pop-upvenster                    |
| 3   | `3-options-light`     | Manage site groups, URL patterns and marks                          | Beheer sitegroepen, URL-patronen en markeringen                     |
| 4   | `4-marked-page-dark`  | The same marks on a dark page                                       | Dezelfde markeringen op een donkere pagina                          |
| 5   | `5-popup-dark`        | The popup in dark mode                                              | De pop-up in donkere modus                                          |
