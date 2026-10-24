# Store listings

The content every store listing shares (D-256), kept here so it is version controlled: copy it into each
store's dashboard. T-152 wrote the listing texts, permission justifications and
screenshots for Chrome, Edge and Firefox; T-157 does the same for the App Store. Everything that points to the web
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

| Store                  | Website field   | Privacy field                  | Support field            | Status   |
| ---------------------- | --------------- | ------------------------------ | ------------------------ | -------- |
| Chrome Web Store       | _Homepage URL_  | _Privacy policy URL_           | _Support URL_            | T-152 ✅ |
| Microsoft Edge Add-ons | _Website_       | _Privacy policy URL_           | _Support contact_        | T-152 ✅ |
| Firefox Add-ons (AMO)  | _Homepage_      | _Privacy policy_ (text or URL) | _Support website_        | T-152 ✅ |
| App Store (Safari)     | _Marketing URL_ | _Privacy Policy URL_           | _Support URL_ (required) | T-157 ☐  |

When a listing goes live, put its URL in [`website/src/config/stores.ts`](../website/src/config/stores.ts):
the website's install button for that store then turns from a disabled "Coming in the future" into a link (Chrome, Edge and Firefox are live) (REQ-PAGE-002).

## Listing texts

Name (D-300, from the package's `extName`): **SiteMark – Environment Indicator** (en), **SiteMark – Omgevingsindicator**
(nl). The brand stays SiteMark.

| Store                  | Category          | Languages |
| ---------------------- | ----------------- | --------- |
| Chrome Web Store       | _Developer Tools_ | en, nl    |
| Microsoft Edge Add-ons | _Developer tools_ | en, nl    |
| Firefox Add-ons (AMO)  | _Web Development_ | en, nl    |

### Short description (≤ 132 characters)

Keyword first, so the store search and the result list read it as "environment indicator". Chrome and Edge take
this field from the package (`extDescription` in `public/_locales`); AMO has its own _Summary_ field. Change the
package text only together with a release.

- **en:** Environment indicator: mark production, staging and test sites with a ribbon, banner or frame. Collects no data. (112)
- **nl:** Omgevingsindicator: markeer productie-, staging- en testsites met een lint, banner of kader. Verzamelt geen gegevens. (117)

### Long description

Plain text only: the store dashboards don't format text, so a feature list uses lines that start with "- ". The
first two lines carry the search words (environment indicator, staging, production, banner). "Collects no data" is
the wording of the privacy policy; do not use "nothing leaves your browser" (the opt-in favicon tint loads the
icon of the page you are on).

**en**

```text
Never mix up production and test again. SiteMark is an environment indicator for your browser: it puts a ribbon, banner, frame or outline on the sites you choose, so production, staging, test and acceptance never look the same.

What you get
- Colour-coded marks: a corner ribbon, a banner, a frame around the window, a tint, hazard stripes or a watermark
- Mark one element: pick the button that deletes customers and give it an outline or a ribbon
- A title prefix such as [PROD] and a coloured favicon dot, so you find the right tab among many
- Hide the marks on one tab for a clean screenshot or demo, with an optional shortcut
- URL patterns from simple wildcards (*.example.com) to regular expressions
- Export and import your settings as a file
- English and Dutch, light and dark, and it works with the keyboard

Private by design
- No access to any website until you add one, and then only that website
- No accounts, no analytics and no servers: SiteMark collects no data
- Your settings stay in your browser

Free to use. The source code is public to read; all rights reserved.
Website, help and privacy policy: https://nielsbrakel.github.io/SiteMark/
```

**nl**

```text
Verwar productie en test nooit meer. SiteMark is een omgevingsindicator voor je browser: het zet een lint, banner, kader of omlijning op de sites die jij kiest, zodat productie, staging, test en acceptatie er nooit hetzelfde uitzien.

Dit krijg je
- Markeringen in kleur: een lint in de hoek, een banner, een kader om het venster, een tint, waarschuwingsstrepen of een watermerk
- Eén element markeren: kies de knop waarmee je klanten verwijdert en geef hem een kader of een lint
- Een voorvoegsel in de tabtitel zoals [PROD] en een gekleurde stip op het favicon, zodat je het juiste tabblad snel vindt
- Verberg de markeringen op één tabblad voor een schone screenshot of demo, met een optionele sneltoets
- URL-patronen van eenvoudige jokertekens (*.example.com) tot reguliere expressies
- Exporteer en importeer je instellingen als bestand
- Engels en Nederlands, licht en donker, en goed met het toetsenbord te bedienen

Privé als uitgangspunt
- Geen toegang tot een website totdat je die toevoegt, en dan alleen tot die ene website
- Geen accounts, geen analytics en geen servers: SiteMark verzamelt geen gegevens
- Je instellingen blijven in je browser

Gratis te gebruiken. De broncode is openbaar om te lezen; alle rechten voorbehouden.
Website, help en privacyverklaring: https://nielsbrakel.github.io/SiteMark/nl/
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

All images are generated, never made by hand (D-251, D-299): `pnpm web:screenshots` writes the six store screenshots
per language, in light and dark, into [`images/`](images/), and `pnpm icons` renders the icons and the promo tiles there.

| File in `images/`                              | Size       | Chrome | Edge | Firefox |
| ---------------------------------------------- | ---------- | :----: | :--: | :-----: |
| `icon-128.png` (store icon)                    | 128 × 128  |   ✓    |      |    ✓    |
| `icon-300.png` (store logo)                    | 300 × 300  |        |  ✓   |         |
| `{en,nl}/1…5-*.png` (screenshots, light)       | 1280 × 800 |   ✓    |  ✓   |    ✓    |
| `{en,nl}/6-privacy.png` (screenshot, light)    | 1280 × 800 |        |  ✓   |    ✓    |
| `{en,nl}/dark/1…6-*.png` (screenshots, dark)   | 1280 × 800 |  (✓)   | (✓)  |   (✓)   |
| `{en,nl}/promo-small-440x280.png` (small tile) | 440 × 280  |   ✓    |  ✓   |         |
| `{en,nl}/promo-marquee-1400x560.png` (marquee) | 1400 × 560 |   ✓    |  ✓   |         |

- Everything in `en/` and `nl/` is localised: screenshots, promo tiles and the captions below. Upload `nl` to the
  Dutch listing and `en` to the English one.
- Screenshots are 24-bit PNG without alpha, numbered in upload order. Chrome allows 5 per language, so upload 1–5
  there; Edge and Firefox also take 6. `en` and `nl` are each a complete set. Chrome's **global** screenshots are the
  `en` set.
- **Light is the default set.** The `dark/` folders hold the same six slides in the dark theme, an optional alternative
  set (for example as extra images on Edge and Firefox, which allow more than six).
- Firefox has no promo tiles. It takes its icon from the package. The icon PNGs have an alpha channel, which
  stores allow for icons.

### Screenshot captions

Each image carries its caption in large type, because the stores show thumbnails.

| #   | File             | en                                | nl                                   |
| --- | ---------------- | --------------------------------- | ------------------------------------ |
| 1   | `1-production`   | Never mistake production for test | Verwar productie nooit meer met test |
| 2   | `2-environments` | Every environment its own colour  | Elke omgeving een eigen kleur        |
| 3   | `3-popup`        | Mark a site in one click          | Markeer een site met één klik        |
| 4   | `4-picker`       | Protect the button that matters   | Bescherm de knop die ertoe doet      |
| 5   | `5-options`      | Fine-tune every mark, see it live | Stel elke markering af, zie het live |
| 6   | `6-privacy`      | Private by design                 | Privé als uitgangspunt               |

The browser's own permission prompt is a native window that a script cannot capture. If you want it in the set, take
that screenshot yourself on a real install and add it as image 7 (Edge and Firefox allow more than five).
