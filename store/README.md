# Store listings

Everything for the store dashboards, version controlled and grouped per store (D-299, D-300): each folder holds that
store's paste-ready listing text (`listing.md`) and the images it takes, in the sizes it asks for (`images/`).
Copy the text into the dashboard and upload the images. Everything that points to the web uses the **website**, never
the repository, so the URLs stay stable (REQ-POLICY-005).

| Store                                     | Texts                                    | Images                               | Status   |
| ----------------------------------------- | ---------------------------------------- | ------------------------------------ | -------- |
| [Chrome Web Store](chrome/listing.md)     | listing, single purpose, permissions     | [`chrome/images/`](chrome/images/)   | T-152 ✅ |
| [Microsoft Edge Add-ons](edge/listing.md) | listing, search terms                    | [`edge/images/`](edge/images/)       | T-152 ✅ |
| [Firefox Add-ons](firefox/listing.md)     | listing, summary, tags                   | [`firefox/images/`](firefox/images/) | T-152 ✅ |
| [Mac App Store](safari/listing.md)        | listing, keywords, review notes, answers | [`safari/images/`](safari/images/)   | T-157 ☐  |

When a listing goes live, put its URL in [`website/src/config/stores.ts`](../website/src/config/stores.ts): the
website's install button for that store then turns into a link (REQ-PAGE-002).

## All stores at a glance

The name is the same on every store (D-300). Counts are characters (App Store keywords: bytes), then the
store's limit. Category is not per language.

| Field                  | Chrome Web Store                                                                                                             | Edge Add-ons                                                                                                                                                                               | Firefox Add-ons (AMO)                                                                                                                                                                                                                                                | Mac App Store (Safari)                                                                                                                                                                                                                                    |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Name (EN)              | "SiteMark Environment Indicator" (30/75)                                                                                     | "SiteMark Environment Indicator" (30/45 recommended)                                                                                                                                       | "SiteMark Environment Indicator" (30/50)                                                                                                                                                                                                                             | "SiteMark Environment Indicator" (30/30)                                                                                                                                                                                                                  |
| Short description (EN) | "Environment indicator: mark production, staging and test sites with a ribbon, banner or frame. Collects no data." (112/112) | "Environment indicator: mark production, staging and test sites with a ribbon, banner or frame. Collects no data." (112/112)                                                               | _Summary_: "Environment indicator for your browser. Mark production, staging and test sites with a coloured ribbon, banner, frame or outline, so you never edit the wrong one. Collects no data; no access to a site until you add it." (218/250)                    | _Subtitle_: "Spot production, staging, test" (30/30); _Promotional text_: "Never mistake production for test: SiteMark puts a ribbon, banner or frame on the sites you choose in Safari. Collects no data, and no access until you add a site." (163/170) |
| Long description (EN)  | shared long description (1,321/16,000)                                                                                       | same text (1,321; 250–10,000)                                                                                                                                                              | same text (1,321)                                                                                                                                                                                                                                                    | own text with Safari steps (1,588/4,000)                                                                                                                                                                                                                  |
| Keywords (EN)          | no field                                                                                                                     | 7 search terms: "environment indicator", "production warning", "staging banner", "test environment", "prod ribbon", "env marker", "developer tools" (longest 21/30, 14/21 words)           | tags: "environment indicator", "production", "staging", "developer tools", "banner" (pick from AMO's list)                                                                                                                                                           | "marker,prod,banner,ribbon,warning,dev,tester,frame,label,url,developer,website,tab,favicon,safe" (95/100 bytes)                                                                                                                                          |
| Name (NL)              | "SiteMark Omgevingsindicator" (27/75)                                                                                        | "SiteMark Omgevingsindicator" (27/45 recommended)                                                                                                                                          | "SiteMark Omgevingsindicator" (27/50)                                                                                                                                                                                                                                | "SiteMark Omgevingsindicator" (27/30)                                                                                                                                                                                                                     |
| Short description (NL) | "Omgevingsindicator: markeer productie-, staging- en testsites met een lint, banner of kader. Geen gegevens." (107/112)      | "Omgevingsindicator: markeer productie-, staging- en testsites met een lint, banner of kader. Geen gegevens." (107/112)                                                                    | _Summary_: "Omgevingsindicator voor je browser. Markeer productie-, staging- en testsites met een gekleurd lint, banner, kader of omlijning, zodat je nooit de verkeerde aanpast. Verzamelt geen gegevens; geen toegang tot een site tot je die toevoegt." (237/250) | _Subtitle_: "Zie productie, staging en test" (30/30); _Promotional text_: "Verwar productie nooit meer met test: SiteMark zet een lint, banner of kader op de sites die jij kiest in Safari. Verzamelt geen gegevens." (138/170)                          |
| Long description (NL)  | shared long description (1,502/16,000)                                                                                       | same text (1,502; 250–10,000)                                                                                                                                                              | same text (1,502)                                                                                                                                                                                                                                                    | own text with Safari steps (1,785/4,000)                                                                                                                                                                                                                  |
| Keywords (NL)          | no field                                                                                                                     | 7 search terms: "omgevingsindicator", "productie waarschuwing", "staging banner", "testomgeving", "productie lint", "omgeving markeren", "ontwikkelaarstools" (longest 22/30, 11/21 words) | tags are not per language                                                                                                                                                                                                                                            | "markering,prod,banner,lint,waarschuwing,dev,kader,label,url,ontwikkelaar,website,tabblad,veilig" (95/100 bytes)                                                                                                                                          |
| Category               | _Developer Tools_                                                                                                            | _Developer tools_                                                                                                                                                                          | _Web Development_, _Privacy & Security_                                                                                                                                                                                                                              | _Developer Tools_, secondary _Productivity_                                                                                                                                                                                                               |

## Website, privacy and support URLs

| Field                          | English                                         | Dutch                                              |
| ------------------------------ | ----------------------------------------------- | -------------------------------------------------- |
| Website / homepage             | https://nielsbrakel.github.io/SiteMark/         | https://nielsbrakel.github.io/SiteMark/nl/         |
| Source code                    | https://github.com/nielsbrakel/SiteMark         | https://github.com/nielsbrakel/SiteMark            |
| Privacy policy                 | https://nielsbrakel.github.io/SiteMark/privacy/ | https://nielsbrakel.github.io/SiteMark/nl/privacy/ |
| Support (App Store, AMO, Edge) | https://nielsbrakel.github.io/SiteMark/support/ | https://nielsbrakel.github.io/SiteMark/nl/support/ |

Stores that take a single URL per field get the English one: every page links its Dutch version.

## Images

All images are generated: `pnpm web:screenshots` writes the six screenshots per language (light, dark for Firefox, and
the light set at 2× for the App Store), `pnpm icons` the icons and promo tiles. Upload `en` to the English listing and
`nl` to the Dutch one. Screenshots are 24-bit PNG without alpha, numbered in upload order; light is the default set.

| Store   | Screenshots                    | Size        | Also                                                  |
| ------- | ------------------------------ | ----------- | ----------------------------------------------------- |
| Chrome  | 1–5                            | 1280 × 800  | icon 128, small tile 440 × 280, marquee 1400 × 560    |
| Edge    | 1–6                            | 1280 × 800  | logo 300, small tile 440 × 280, large tile 1400 × 560 |
| Firefox | 1–6, plus `dark/` as an option | 1280 × 800  | icon comes from the package                           |
| Safari  | 1–6                            | 2560 × 1600 | app icon 1024 × 1024                                  |

## Screenshot captions

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
