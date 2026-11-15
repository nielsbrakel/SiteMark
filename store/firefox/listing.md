# Firefox Add-ons (AMO)

Paste-ready text and images. Fields: _Homepage_, _Privacy policy_ (text or URL), _Support website_; categories _Web Development_ and _Privacy & Security_. Live: https://addons.mozilla.org/en-US/firefox/addon/sitemark/ . Shared across stores: [README](../README.md).

## Name

From the package (`extName`), so it changes only with a release. The brand stays SiteMark: the UI, the website,
the logo, `short_name` and the toolbar tooltip say SiteMark.

- **en:** SiteMark Environment Indicator (30)
- **nl:** SiteMark Omgevingsindicator (27)

## Summary (≤ 250 characters)

- **en:** Environment indicator for your browser. Mark production, staging and test sites with a coloured ribbon, banner, frame or outline, so you never edit the wrong one. Collects no data; no access to a site until you add it. (218)
- **nl:** Omgevingsindicator voor je browser. Markeer productie-, staging- en testsites met een gekleurd lint, banner, kader of omlijning, zodat je nooit de verkeerde aanpast. Verzamelt geen gegevens; geen toegang tot een site tot je die toevoegt. (237)

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

## Tags and categories

- Tags: `environment indicator`, `production`, `staging`, `developer tools`, `banner` (if AMO only offers a fixed list, the closest ones).
- Categories: _Web Development_ and _Privacy & Security_.

## Data-use disclosures

- **Collected data:** none. Chrome: no data types ticked and all three certifications ticked. Edge: "Does your
  extension access, collect or transmit personal information?" No. AMO: the package declares
  `data_collection_permissions: none`.
- SiteMark has no servers, accounts, analytics, crash reporting or advertising, and sells or shares nothing
  (REQ-PRIV-005).
- AMO asks for the privacy policy text: "SiteMark collects no data. Full privacy policy:" and the privacy URL.
- AMO license (per version): All Rights Reserved.

## Images

Generated, never made by hand (`pnpm web:screenshots`, `pnpm icons`). Upload `en` to the English listing and `nl` to the Dutch one.

| File in `images/`        | Size       | Use                                          |
| ------------------------ | ---------- | -------------------------------------------- |
| `{en,nl}/1…6-*.png`      | 1280 × 800 | screenshots, light (the default set)         |
| `{en,nl}/dark/1…6-*.png` | 1280 × 800 | the same slides in the dark theme (optional) |

No promo tiles and no icon file: AMO takes the icon from the package. AMO takes more than six screenshots, each with a caption ([README](../README.md#screenshot-captions)). The browser's own permission prompt is a native window a script cannot capture; take that one yourself on a real install if you want it.
