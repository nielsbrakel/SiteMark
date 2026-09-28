---
title: Problemen oplossen
description: Wat je controleert als markeringen niet verschijnen, of juist waar dat niet moet.
order: 8
---

De meeste problemen hebben een korte lijst oorzaken. Begin bij de pop-up: open die op de betreffende pagina, en hij vertelt welke sitegroepen passen en wat er ontbreekt.

## De markeringen verschijnen niet

- **Er past geen sitegroep.** De pop-up meldt het. Controleer de patronen in de instellingen met de URL-tester.
- **De sitegroep is uitgeschakeld.** De pop-up toont hem als uitgeschakeld, met een link naar de instellingen, waar je hem aanzet.
- **De toegang is niet verleend.** De pop-up toont **Toestaan**. Zonder toegang verschijnen markeringen pas nadat je de pop-up opent.
- **De pagina is verboden terrein.** Instellingenpagina’s van de browser, extensiewinkels, de pdf-viewer en lokale bestanden laten geen extensies toe, en de pop-up meldt dat SiteMark niet op deze pagina kan draaien.
- **De pagina staat in een frame.** SiteMark markeert alleen pagina’s op het hoogste niveau.
- **De markeringen zijn verborgen.** Iemand drukte op Verbergen op dit tabblad; druk er nog eens op.

## Een elementmarkering ontbreekt

De pop-up toont elementmarkeringen als gevonden of niet gevonden. Is de pagina anders opgebouwd, druk dan op **Opnieuw kiezen** en kies het element nog eens. Een uitroepteken op de knop in de werkbalk betekent dat iets op dit tabblad niet helemaal getoond kon worden.

## Markeringen verschijnen waar dat niet moet

Misschien past een patroon op meer dan je verwacht. De URL-tester noemt het patroon dat paste. Voeg een uitsluitpatroon toe, of maak het patroon specifieker.

## Kom je er niet uit?

Kopieer de diagnose vanaf de instellingenpagina (die bevat geen pagina-adressen, alleen de sites zelf) en open een issue op GitHub. De ondersteuningspagina noemt wat ons verder helpt om jou te helpen.
