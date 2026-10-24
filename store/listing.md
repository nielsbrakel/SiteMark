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

Final and paste-ready (D-300). Every count below was checked by a script; the tests check the package texts
(REQ-I18N-005). Paste each field as it stands; the code blocks keep the line breaks.

| Field       | Chrome Web Store                  | Edge Add-ons                         | Firefox AMO                             |
| ----------- | --------------------------------- | ------------------------------------ | --------------------------------------- |
| Name        | package `extName`, max 75         | package, 45 recommended              | package, max 50                         |
| Short text  | package `extDescription`, max 132 | package, max 132                     | own _Summary_, max 250                  |
| Description | plain text, max 16,000            | plain text, 250–10,000               | limited HTML                            |
| Keywords    | none                              | 7 terms, ≤ 30 characters, ≤ 21 words | tags                                    |
| Category    | _Developer Tools_                 | _Developer tools_                    | _Web Development_, _Privacy & Security_ |
| Languages   | en, nl                            | en, nl                               | en, nl                                  |

The Mac App Store (Safari, T-157) has its own name, subtitle, keywords and limits: see
[App Store (Safari, macOS)](#app-store-safari-macos).

### Name

From the package (`extName`), so it changes only with a release. The brand stays SiteMark: the UI, the website,
the logo, `short_name` and the toolbar tooltip say SiteMark (D-300).

- **en:** SiteMark – Environment Indicator (32)
- **nl:** SiteMark – Omgevingsindicator (29)

### Short description (Chrome and Edge, ≤ 132 characters)

From the package (`extDescription`). Keyword first, so the store search and the result list read it as
"environment indicator". The privacy wording is "collects no data", as in the privacy policy.

- **en:** Environment indicator: mark production, staging and test sites with a ribbon, banner or frame. Collects no data. (112)
- **nl:** Omgevingsindicator: markeer productie-, staging- en testsites met een lint, banner of kader. Verzamelt geen gegevens. (117)

### Summary (AMO, ≤ 250 characters)

- **en:** Environment indicator for your browser. Mark production, staging and test sites with a coloured ribbon, banner, frame or outline, so you never edit the wrong one. Collects no data; no access to a site until you add it. (218)
- **nl:** Omgevingsindicator voor je browser. Markeer productie-, staging- en testsites met een gekleurd lint, banner, kader of omlijning, zodat je nooit de verkeerde aanpast. Verzamelt geen gegevens; geen toegang tot een site tot je die toevoegt. (237)

### Long description (all stores)

Plain text only: the store dashboards don't format text, so a feature list uses lines that start with "- ". The
first sentence carries the search words (environment indicator, production, staging, test); the line before the
footer names the synonyms once. No keyword lists and no competitor names (Chrome Web Store spam policy). "Collects
no data" is the wording of the privacy policy; do not use "nothing leaves your browser" (the opt-in favicon tint
loads the icon of the page you are on).

**en** (1321 characters)

```text
SiteMark is an environment indicator for your browser: it puts a ribbon, banner, frame or outline on the production, staging, test and acceptance sites you choose, so you never mix them up.

What you get
- A different colour per environment: red production, amber staging, blue test, or your own
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

Also known as an environment banner, prod warning or env marker, for developers, QA and support teams.

Free to use. The source code is public to read; all rights reserved.
Website, help and privacy policy: https://nielsbrakel.github.io/SiteMark/
```

**nl** (1502 characters)

```text
SiteMark is een omgevingsindicator voor je browser: het zet een lint, banner, kader of omlijning op de productie-, staging-, test- en acceptatiesites die jij kiest, zodat je ze nooit verwart.

Dit krijg je
- Een eigen kleur per omgeving: rood voor productie, oranje voor staging, blauw voor test, of je eigen kleur
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

Ook bekend als omgevingsbanner, productiewaarschuwing of env-marker, voor developers, testers en supportteams.

Gratis te gebruiken. De broncode is openbaar om te lezen; alle rechten voorbehouden.
Website, help en privacyverklaring: https://nielsbrakel.github.io/SiteMark/nl/
```

### Search terms (Edge)

Edge takes up to 7 terms of at most 30 characters each, and at most 21 separate words across all terms.

- **en** (14 words): `environment indicator`, `production warning`, `staging banner`, `test environment`, `prod ribbon`, `env marker`, `developer tools`
- **nl** (11 words): `omgevingsindicator`, `productie waarschuwing`, `staging banner`, `testomgeving`, `productie lint`, `omgeving markeren`, `ontwikkelaarstools`

### Tags and categories (AMO)

- Tags: `environment indicator`, `production`, `staging`, `developer tools`, `banner` (if AMO only offers a fixed list, the closest ones).
- Categories: _Web Development_ and _Privacy & Security_.

## Single purpose (Chrome Web Store)

> SiteMark visually marks the websites the user chooses (for example production environments) so they cannot be confused with other environments.

## Permission justifications

Matching [PRIVACY.md](../PRIVACY.md#permissions-and-why-sitemark-needs-them).

| Permission                       | Justification                                                                                                                                                                                                    |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `storage`                        | Keeps the user's site groups, URL patterns, marks and settings in storage.local. Nothing is synced or sent anywhere.                                                                                             |
| `scripting`                      | Registers the marker content script for the websites the user granted, so marks appear on every visit, and injects the element picker when the user asks for it.                                                 |
| `activeTab`                      | Lets the user pick an element or mark the current site from the toolbar button or shortcut, on the tab they are using, without broad host access.                                                                |
| Optional host access (`*://*/*`) | Never granted at install. When the user adds a URL pattern, SiteMark requests that website only; the marker runs only on websites the user granted. It reads a page only to find picked elements and draw marks. |
| Remote code                      | No, I am not using remote code. All code is in the package: no eval, no new Function and no remote scripts.                                                                                                      |

## Data-use disclosures

- **Collected data:** none. Chrome: no data types ticked and all three certifications ticked. Edge: "Does your
  extension access, collect or transmit personal information?" No. AMO: the package declares
  `data_collection_permissions: none`.
- SiteMark has no servers, accounts, analytics, crash reporting or advertising, and sells or shares nothing
  (REQ-PRIV-005).
- AMO asks for the privacy policy text: "SiteMark collects no data. Full privacy policy:" and the privacy URL.
- AMO license (per version): All Rights Reserved.

## App Store (Safari, macOS)

Safari ships later (D-213, D-292, T-155…T-157): macOS only (Safari 18), no iOS app (D-241). App Store Connect →
the app → _App Information_ (name, subtitle, category, privacy URL), the version page (texts, screenshots,
keywords, URLs, build, review notes) and _App Privacy_. Add Dutch under the localisation menu (top right).

Checked on 2026-10-24 against Apple's App Store Connect reference
(developer.apple.com/help/app-store-connect/reference/…): name 2–30 characters, subtitle ≤ 30, promotional
text ≤ 170, description ≤ 4000, what's new ≤ 4000, keywords ≤ 100 **bytes** (each keyword longer than two
characters, no app or company names, don't repeat the name), privacy policy URL required for macOS apps,
subcategories only for Games and Stickers, Mac screenshots 16:10 at 1280 × 800, 1440 × 900, 2560 × 1600 or
2880 × 1800, 1–10 per size, PNG or JPEG without alpha, age-rating questionnaire items and the lowest rating 4+,
and the Safari web extension packager (App Store Connect → Users and Access → Xcode Cloud, or
`xcrun safari-web-extension-packager`). **Not verified** from an official page: the exact wording of the App
Privacy answer that yields "Data Not Collected", the export-compliance questions, the Safari 18 menu path
(Safari > Settings > Extensions), the 1024 × 1024 app-icon rule (taken from Apple's design guidance and WWDC 2020),
and the keyword separator (Apple's docs don't name one; commas without spaces are the common practice).

### Name (max 30)

The store name of the other stores, "SiteMark – Environment Indicator" (32), does not fit. Dutch keeps the package name.

**English** (29 characters)

```text
SiteMark – Environment Marker
```

**Dutch** (29 characters)

```text
SiteMark – Omgevingsindicator
```

### Subtitle (max 30)

**English** (30 characters)

```text
Spot production, staging, test
```

**Dutch** (30 characters)

```text
Zie productie, staging en test
```

### Promotional text (max 170, can change without a new version)

**English** (163 characters)

```text
Never mistake production for test: SiteMark puts a ribbon, banner or frame on the sites you choose in Safari. Collects no data, and no access until you add a site.
```

**Dutch** (138 characters)

```text
Verwar productie nooit meer met test: SiteMark zet een lint, banner of kader op de sites die jij kiest in Safari. Verzamelt geen gegevens.
```

### Description (max 4000, plain text)

**English** (1588 characters)

```text
SiteMark is an environment indicator for Safari: it puts a ribbon, banner, frame or outline on the production, staging, test and acceptance sites you choose, so you never mix them up.

How to start
1. Open SiteMark once, then turn it on in Safari > Settings > Extensions.
2. Open a site you want to mark, click the SiteMark button in the toolbar and choose Mark this site.
3. Safari asks whether SiteMark may access that site. Allow it: SiteMark never asks for any other site, and you can change this at any time in Safari's settings.

What you get
- A different colour per environment: red production, amber staging, blue test, or your own
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
- Your settings stay on your Mac, in Safari

Also known as an environment banner, prod warning or env marker, for developers, QA and support teams.

Free to use. Also available for Chrome, Edge and Firefox.
```

**Dutch** (1785 characters)

```text
SiteMark is een omgevingsindicator voor Safari: het zet een lint, banner, kader of omlijning op de productie-, staging-, test- en acceptatiesites die jij kiest, zodat je ze nooit verwart.

Zo begin je
1. Open SiteMark één keer en zet de extensie aan in Safari > Instellingen > Extensies.
2. Open een site die je wilt markeren, klik op de SiteMark-knop in de knoppenbalk en kies Deze site markeren.
3. Safari vraagt of SiteMark die site mag gebruiken. Sta het toe: SiteMark vraagt nooit om andere sites, en je kunt dit altijd wijzigen in de instellingen van Safari.

Dit krijg je
- Een eigen kleur per omgeving: rood voor productie, oranje voor staging, blauw voor test, of je eigen kleur
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
- Je instellingen blijven op je Mac, in Safari

Ook bekend als omgevingsbanner, productiewaarschuwing of env-marker, voor developers, testers en supportteams.

Gratis te gebruiken. Ook beschikbaar voor Chrome, Edge en Firefox.
```

### Keywords (max 100 bytes, comma-separated, no words from the name or subtitle)

**English** (98 bytes)

```text
indicator,prod,banner,ribbon,warning,dev,tester,frame,label,url,developer,website,tab,favicon,safe
```

**Dutch** (95 bytes)

```text
markering,prod,banner,lint,waarschuwing,dev,kader,label,url,ontwikkelaar,website,tabblad,veilig
```

### What's New in This Version (max 4000)

**English** (36 characters)

```text
First release for Safari on the Mac.
```

**Dutch** (36 characters)

```text
Eerste versie voor Safari op de Mac.
```

### URLs (per language)

| Field                           | English                                         | Dutch                                              |
| ------------------------------- | ----------------------------------------------- | -------------------------------------------------- |
| _Marketing URL_                 | https://nielsbrakel.github.io/SiteMark/         | https://nielsbrakel.github.io/SiteMark/nl/         |
| _Support URL_ (required)        | https://nielsbrakel.github.io/SiteMark/support/ | https://nielsbrakel.github.io/SiteMark/nl/support/ |
| _Privacy Policy URL_ (required) | https://nielsbrakel.github.io/SiteMark/privacy/ | https://nielsbrakel.github.io/SiteMark/nl/privacy/ |

### Copyright (Apple adds the ©)

```text
2026 Niels van Brakel
```

### Category, price and other answers

- _Primary category_: **Developer Tools** (in Xcode: `LSApplicationCategoryType` = `public.app-category.developer-tools`;
  it must match). _Secondary category_: **Productivity**.
- _Price_: **Free**, all territories. No in-app purchases.
- _Age rating_: answer **None / No** to every item (parental controls, age assurance, unrestricted web access,
  user-generated content, social media, messaging, advertising, mature themes, medical, sexuality, violence,
  chance-based activities). Result: **4+**. "Unrestricted web access" is No: SiteMark is not a browser.
- _Content rights_: does not contain, show or access third-party content.
- _App Privacy_: "Do you or your third-party partners collect data from this app?" **No** → the product page shows
  **Data Not Collected**. Privacy policy URL as above.
- _Export compliance_: the app uses **no encryption** (no network requests of its own). Set
  `ITSAppUsesNonExemptEncryption` = `NO` in the app's Info.plist so App Store Connect stops asking per build.
- _Sign-in required_: no.

### App Review Information → Notes

777 characters. Contact: your name, email and phone. No demo account.

```text
SiteMark is a Safari web extension; the app itself only explains how to turn it on. No account or login is needed.

To test:
1. Open SiteMark once, then turn it on in Safari > Settings > Extensions.
2. In Safari, open https://example.com/ and click the SiteMark button in the toolbar.
3. Click "Mark this site". Safari asks to allow SiteMark on example.com; allow it.
4. The page now shows a coloured corner ribbon. Click the toolbar button again and choose Settings to change the colour or add a banner, frame or title prefix; the marks update at once.
5. Click "Pick element" in the toolbar popup, click any element on the page and save: it gets its own outline.

SiteMark makes no network requests of its own, collects no data and asks for website access one site at a time.
```

### Images

- _App icon_: comes from the build (`store/images/icon-1024.png`, 1024 × 1024, opaque, square: put it in the
  Xcode project's AppIcon set; Apple applies the corner shape).
- _Mac screenshots_ (2560 × 1600, 16:10, RGB without alpha, up to 10), in this order, English:

  1. `store/images/en/appstore/1-production.png`
  2. `store/images/en/appstore/2-environments.png`
  3. `store/images/en/appstore/3-popup.png`
  4. `store/images/en/appstore/4-picker.png`
  5. `store/images/en/appstore/5-options.png`
  6. `store/images/en/appstore/6-privacy.png`

  Dutch localisation: the same six files from `store/images/nl/appstore/`. These are the light slides at 2×;
  there is no room or need for the dark set.

- No promo tiles and no iPhone or iPad screenshots (the app is macOS-only).

## Images

All images are generated, never made by hand (D-251, D-299): `pnpm web:screenshots` writes the six store screenshots
per language, in light and dark (and the light set at 2× for the App Store), into [`images/`](images/), and `pnpm icons` renders the icons and the promo tiles there.

| File in `images/`                                           | Size        | Chrome | Edge |  Firefox  | App Store |
| ----------------------------------------------------------- | ----------- | :----: | :--: | :-------: | :-------: |
| `icon-128.png` (store icon)                                 | 128 × 128   |   ✓    |      | (package) |           |
| `icon-300.png` (store logo)                                 | 300 × 300   |        |  ✓   |           |           |
| `icon-1024.png` (app icon, opaque, square)                  | 1024 × 1024 |        |      |           |  (Xcode)  |
| `{en,nl}/1…5-*.png` (screenshots, light)                    | 1280 × 800  |   ✓    |  ✓   |     ✓     |           |
| `{en,nl}/6-privacy.png` (screenshot, light)                 | 1280 × 800  |        |  ✓   |     ✓     |           |
| `{en,nl}/dark/1…6-*.png` (screenshots, dark)                | 1280 × 800  |        |      |    (✓)    |           |
| `{en,nl}/appstore/1…6-*.png` (screenshots, light, 2×)       | 2560 × 1600 |        |      |           |     ✓     |
| `{en,nl}/promo-small-440x280.png` (small tile)              | 440 × 280   |   ✓    |  ✓   |           |           |
| `{en,nl}/promo-marquee-1400x560.png` (marquee / large tile) | 1400 × 560  |   ✓    |  ✓   |           |           |

- Everything in `en/` and `nl/` is localised: screenshots, promo tiles and the captions below. Upload `nl` to the
  Dutch listing and `en` to the English one. Chrome's **global** screenshots are the `en` set.
- Screenshots are 24-bit PNG without alpha, numbered in upload order. Chrome takes 5 per language (1–5), Edge 6
  (1–6), AMO more.
- **Light is the default set.** The `dark/` folders hold the same six slides in the dark theme. Chrome and Edge have
  no room for both, so dark is only an alternative there; on AMO it may follow the light set.
- Firefox has no promo tiles and takes its icon from the package. The icon PNGs have an alpha channel, which
  stores allow for icons.

### Screenshot captions

Each image carries its caption in large type, because the stores show thumbnails. AMO also takes a caption per
screenshot: use these.

| #   | File             | en                                | nl                                   |
| --- | ---------------- | --------------------------------- | ------------------------------------ |
| 1   | `1-production`   | Never mistake production for test | Verwar productie nooit meer met test |
| 2   | `2-environments` | Every environment its own colour  | Elke omgeving een eigen kleur        |
| 3   | `3-popup`        | Mark a site in one click          | Markeer een site met één klik        |
| 4   | `4-picker`       | Protect the button that matters   | Bescherm de knop die ertoe doet      |
| 5   | `5-options`      | Fine-tune every mark, see it live | Stel elke markering af, zie het live |
| 6   | `6-privacy`      | Private by design                 | Privé als uitgangspunt               |

The browser's own permission prompt is a native window that a script cannot capture. If you want it in the set, take
that screenshot yourself on a real install and add it on AMO (Chrome and Edge are full).
