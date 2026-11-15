# Microsoft Edge Add-ons

Paste-ready listing text and images (D-300). Fields: _Website_, _Privacy policy URL_, _Support contact_; category _Developer tools_. Live: https://microsoftedge.microsoft.com/addons/detail/sitemark/edfcmbpeagdkacfidejninkikjiffojn . Shared across stores: [README](../README.md).

## Name

From the package (`extName`), so it changes only with a release. The brand stays SiteMark: the UI, the website,
the logo, `short_name` and the toolbar tooltip say SiteMark (D-300).

- **en:** SiteMark Environment Indicator (30)
- **nl:** SiteMark Omgevingsindicator (27)

## Short description (≤ 132 characters)

From the package (`extDescription`). Keyword first, so the store search and the result list read it as
"environment indicator". The privacy wording is "collects no data", as in the privacy policy.

- **en:** Environment indicator: mark production, staging and test sites with a ribbon, banner or frame. Collects no data. (112)
- **nl:** Omgevingsindicator: markeer productie-, staging- en testsites met een lint, banner of kader. Geen gegevens. (107)

## Long description

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

## Search terms

Edge takes up to 7 terms of at most 30 characters each, and at most 21 separate words across all terms.

- **en** (14 words): `environment indicator`, `production warning`, `staging banner`, `test environment`, `prod ribbon`, `env marker`, `developer tools`
- **nl** (11 words): `omgevingsindicator`, `productie waarschuwing`, `staging banner`, `testomgeving`, `productie lint`, `omgeving markeren`, `ontwikkelaarstools`

## Data-use disclosures

- **Collected data:** none. Chrome: no data types ticked and all three certifications ticked. Edge: "Does your
  extension access, collect or transmit personal information?" No. AMO: the package declares
  `data_collection_permissions: none`.
- SiteMark has no servers, accounts, analytics, crash reporting or advertising, and sells or shares nothing
  (REQ-PRIV-005).
- AMO asks for the privacy policy text: "SiteMark collects no data. Full privacy policy:" and the privacy URL.
- AMO license (per version): All Rights Reserved.

## Images

Generated, never made by hand (`pnpm web:screenshots`, `pnpm icons`; D-251, D-299). Upload `en` to the English listing and `nl` to the Dutch one.

| File in `images/`                    | Size       | Use                 |
| ------------------------------------ | ---------- | ------------------- |
| `icon-300.png`                       | 300 × 300  | store logo          |
| `{en,nl}/1…6-*.png`                  | 1280 × 800 | screenshots (max 6) |
| `{en,nl}/promo-small-440x280.png`    | 440 × 280  | small promo tile    |
| `{en,nl}/promo-marquee-1400x560.png` | 1400 × 560 | large promo tile    |

Captions: [README](../README.md#screenshot-captions).
