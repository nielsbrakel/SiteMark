# Mac App Store (Safari, macOS)

Shared across stores: [README](../README.md). Safari ships later (D-213, D-292, T-155…T-157): macOS only (Safari 18), no iOS app (D-241). App Store Connect →
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

## Name (max 30)

The same name as on Chrome, Edge and Firefox (the package `extName`, D-300); it fits the 30 characters.

**English** (30 characters)

```text
SiteMark Environment Indicator
```

**Dutch** (27 characters)

```text
SiteMark Omgevingsindicator
```

## Subtitle (max 30)

**English** (30 characters)

```text
Spot production, staging, test
```

**Dutch** (30 characters)

```text
Zie productie, staging en test
```

## Promotional text (max 170, can change without a new version)

**English** (163 characters)

```text
Never mistake production for test: SiteMark puts a ribbon, banner or frame on the sites you choose in Safari. Collects no data, and no access until you add a site.
```

**Dutch** (138 characters)

```text
Verwar productie nooit meer met test: SiteMark zet een lint, banner of kader op de sites die jij kiest in Safari. Verzamelt geen gegevens.
```

## Description (max 4000, plain text)

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

## Keywords (max 100 bytes, comma-separated, no words from the name or subtitle)

**English** (95 bytes)

```text
marker,prod,banner,ribbon,warning,dev,tester,frame,label,url,developer,website,tab,favicon,safe
```

**Dutch** (95 bytes)

```text
markering,prod,banner,lint,waarschuwing,dev,kader,label,url,ontwikkelaar,website,tabblad,veilig
```

## What's New in This Version (max 4000)

**English** (36 characters)

```text
First release for Safari on the Mac.
```

**Dutch** (36 characters)

```text
Eerste versie voor Safari op de Mac.
```

## URLs (per language)

| Field                           | English                                         | Dutch                                              |
| ------------------------------- | ----------------------------------------------- | -------------------------------------------------- |
| _Marketing URL_                 | https://nielsbrakel.github.io/SiteMark/         | https://nielsbrakel.github.io/SiteMark/nl/         |
| _Support URL_ (required)        | https://nielsbrakel.github.io/SiteMark/support/ | https://nielsbrakel.github.io/SiteMark/nl/support/ |
| _Privacy Policy URL_ (required) | https://nielsbrakel.github.io/SiteMark/privacy/ | https://nielsbrakel.github.io/SiteMark/nl/privacy/ |

## Copyright (Apple adds the ©)

```text
2026 Niels van Brakel
```

## Category, price and other answers

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

## App Review Information → Notes

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

## Images

Generated, never made by hand (`pnpm web:screenshots`, `pnpm icons`; D-251, D-299). Upload `en` to the English listing and `nl` to the Dutch one.

| File in `images/`   | Size        | Use                                                                                   |
| ------------------- | ----------- | ------------------------------------------------------------------------------------- |
| `icon-1024.png`     | 1024 × 1024 | app icon: opaque, square (Apple adds the corner shape); goes in the Xcode AppIcon set |
| `{en,nl}/1…6-*.png` | 2560 × 1600 | Mac screenshots, 16:10, RGB without alpha (the light slides at 2×)                    |

Order: 1-production, 2-environments, 3-popup, 4-picker, 5-options, 6-privacy. Apple takes 1–10 Mac screenshots at
1280 × 800, 1440 × 900, 2560 × 1600 or 2880 × 1800 and shows one size, so 2560 × 1600 alone is enough. No dark set,
no promo tiles, no App Preview video and no iPhone or iPad screenshots (macOS only, D-241). Captions:
[README](../README.md#screenshot-captions).
