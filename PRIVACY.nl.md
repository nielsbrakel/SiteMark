# Privacyverklaring

Laatst bijgewerkt: 2026-09-26

Deze verklaring gaat over de **browserextensie SiteMark** en de **website van SiteMark**
(nielsbrakel.github.io/SiteMark). Ze is ook in het Engels beschikbaar.

## In het kort

- SiteMark verzamelt geen gegevens. Er zijn geen accounts, geen analytics en geen eigen servers.
- Je sitegroepen en instellingen blijven in je browser, in de lokale opslag van de extensie.
- De website plaatst geen cookies, laadt niets van andere websites en onthoudt alleen je themakeuze.
- Contact loopt alleen via GitHub. Er is geen e-mailadres.

## Wie is verantwoordelijk

SiteMark is een opensourceproject van **Niels Brakel, Nederland**, die verwerkingsverantwoordelijke is voor
deze verklaring. SiteMark wordt in de vrije tijd onderhouden en is geen bedrijf.

## De extensie

### Er worden geen gegevens verzameld

SiteMark verzamelt geen gegevens en verstuurt, verkoopt of deelt ze ook niet. De extensie doet zelf geen
netwerkverzoeken, laadt geen code van buitenaf en bevat geen analytics, tracking of crashrapportage. De enige
uitzondering is het faviconverzoek hieronder: dat gaat naar de website die je bezoekt, en alleen als je het
aanzet.

### Wat in je browser blijft

Je sitegroepen, URL-patronen, markeringen en instellingen staan in de `storage.local`-opslag van de extensie
in je browser. Ze staan nooit in `storage.sync`, dus je browser kopieert ze niet naar zijn cloudaccount. Als
opgeslagen gegevens niet te lezen zijn, bewaart SiteMark maximaal drie reservekopieën ernaast, ook in
`storage.local`. Als je SiteMark verwijdert, verdwijnt alles, en dat geldt ook voor **Alles resetten** op de
optiepagina.

### Rechten en waarom SiteMark ze nodig heeft

| Recht                                       | Waarom                                                                                                                                                                                                |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `storage`                                   | Om je sitegroepen en instellingen in `storage.local` te bewaren.                                                                                                                                      |
| `scripting`                                 | Om markeringen te tonen op pagina's die bij je URL-patronen passen.                                                                                                                                   |
| `activeTab`                                 | Om een element te kiezen of een site te markeren op het tabblad dat je gebruikt, pas nadat je op SiteMark klikt of de sneltoets gebruikt.                                                             |
| Toegang tot websites (`*://*/*`, optioneel) | Nooit bij de installatie. Als je een URL-patroon toevoegt, vraagt SiteMark alleen toegang tot die website, en de extensie werkt alleen op websites die je toestaat. Je kunt toegang altijd intrekken. |

SiteMark leest een pagina alleen om de elementen te vinden die je hebt gekozen en om de markeringen te tekenen.
De extensie leest of bewaart niet wat er op de pagina staat.

### Het faviconverzoek

De faviconkleur staat **standaard uit**. Als je die voor een markering aanzet, laadt SiteMark de favicon van
de pagina die je bezoekt om er een gekleurde stip op te tekenen. Dat verzoek gaat naar de website zelf (of naar
de plek waar die website haar pictogram bewaart), net als wanneer je browser het tabblad toont. SiteMark stuurt
er verder niets mee.

### Webpagina's kunnen markeringen zien

Markeringen worden in de pagina's getekend die je bezoekt. Een website kan zien dat ze er zijn, en zou ze in
theorie kunnen verbergen, verplaatsen of namaken. SiteMark voorkomt vergissingen, maar is geen
beveiligingsmaatregel. Het kiespaneel voor elementen staat ook in de pagina, dus de website kan zien wat je
daarin typt.

### Het titelvoorvoegsel en je browsergeschiedenis

Als je een titelvoorvoegsel aanzet (zoals `[PROD]`), wordt dat onderdeel van de titel van het tabblad. Je
browser bewaart paginatitels in de geschiedenis, dus het voorvoegsel kan daar ook terechtkomen, en in alles wat
die geschiedenis synchroniseert of leest.

### Exportbestanden

Een exportbestand bevat je sitegroepen en URL-patronen, en daarin kunnen interne hostnamen staan. Het bestand
wordt alleen opgeslagen waar jij kiest. Behandel het als interne informatie voordat je het deelt.

### Diagnostiek kopiëren

**Diagnostiek kopiëren** zet de versie van SiteMark, je browser, de status van de rechten en de status van de
markeringen op je klembord, met de origins van websites maar zonder volledige URL's. Het gaat nergens heen tenzij
je het plakt, bijvoorbeeld in een bugmelding.

### Extensiewinkels

Je installeert SiteMark via een extensiewinkel (Chrome Web Store, Microsoft Edge Add-ons, Firefox Add-ons en
vanaf v1.1 de App Store). De winkel verwerkt je installatie volgens zijn eigen privacybeleid. Winkels kunnen de
maker totaalcijfers tonen, zoals het aantal gebruikers; daarmee ben je niet te herkennen.

## De website

### Geen cookies, analytics of derden

De website plaatst geen cookies en heeft geen analytics, trackers, ingesloten inhoud, webfonts of content
delivery networks. Elk bestand komt van de website zelf. Links naar GitHub en de extensiewinkels brengen je
daar pas heen als je erop klikt.

### Je themakeuze

Als je met de themaknop Licht of Donker kiest, onthoudt de website die keuze in de lokale opslag van je browser
onder de sleutel `sitemark-website:theme`. Kies je Automatisch, dan wordt die weer verwijderd. Verder wordt er
niets opgeslagen, en de keuze verlaat je browser nooit.

### Hosting door GitHub Pages

De website wordt gehost door GitHub Pages. Zoals elke webserver ontvangt GitHub bij een bezoek je IP-adres en de
gebruikelijke gegevens van het verzoek, en kan die in zijn serverlogs bewaren, bijvoorbeeld voor de beveiliging.
SiteMark heeft geen toegang tot die logs. GitHub beschrijft dit in het
[GitHub General Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement)
(in het Engels).

### GitHub Issues zijn openbaar

Vragen en bugmeldingen lopen via GitHub Issues. Issues zijn openbaar, en daarvoor gelden de voorwaarden en de
privacyverklaring van GitHub. Zet geen interne hostnamen of andere privégegevens in een issue.

## Je rechten

Onder de AVG kun je vragen welke persoonsgegevens over je worden verwerkt, en vragen om ze te corrigeren of te
verwijderen. SiteMark heeft geen persoonsgegevens over je, dus er is niets om te geven of te verwijderen.
Gegevens in je browser heb je zelf in de hand, en GitHub behandelt verzoeken over GitHub-accounts, issues en
serverlogs. Je kunt ook een klacht indienen bij de Autoriteit Persoonsgegevens.

## Contact

- Vragen over deze verklaring: open een issue op <https://github.com/nielsbrakel/SiteMark/issues>.
- Alles wat gevoelig is, zoals een beveiligingsprobleem: gebruik private vulnerability reporting op
  <https://github.com/nielsbrakel/SiteMark/security/advisories/new> (zie [SECURITY.md](SECURITY.md)).

## Wijzigingen

Als SiteMark iets anders gaat doen met gegevens, verandert eerst deze verklaring en wordt de datum bovenaan
bijgewerkt. Elke wijziging is te zien in de geschiedenis van dit bestand in de repository.
