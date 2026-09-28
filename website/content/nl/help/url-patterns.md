---
title: URL-patronen
description: Vertel een sitegroep welke pagina’s hij markeert, met jokertekens of reguliere expressies.
order: 2
---

Een sitegroep markeert elke pagina waar een van zijn URL-patronen op past. Er zijn twee soorten patronen: jokertekenpatronen voor dagelijks gebruik en reguliere expressies voor bijzondere gevallen.

## Jokertekenpatronen

Een jokertekenpatroon lijkt op een webadres: `schema://host/pad`. Een `*` staat voor een willekeurig stuk tekst.

- `https://example.com/*` past op elke pagina van example.com via HTTPS.
- `*://example.com/*` past op zowel HTTP als HTTPS.
- `*.example.com` past op example.com en al zijn subdomeinen, zoals `shop.example.com`.
- `example.com/admin/*` past alleen op het beheergedeelte.
- `localhost:3000` past alleen op die poort. Zonder poort past elke poort.

Het schema en het pad mag je weglaten: `example.com` betekent `*://example.com/*`. Zonder `*` aan het eind moet een pad precies kloppen, dus `/admin` is iets anders dan `/admin/`. De querystring telt niet mee, tenzij het patroon een `?` bevat.

SiteMark weigert patronen die veel te veel zouden treffen, zoals een losse `*` als host of `*.com`. Zo blijven zowel de markeringen als de rechten beperkt tot de sites die je bedoelt.

## Reguliere expressies

Voor gevallen die jokertekens niet aankunnen, kan een patroon een reguliere expressie zijn. Die wordt getest op het volledige adres, en alleen op de origins die je erbij opgeeft, zodat SiteMark nooit toegang tot alle sites nodig heeft. Om je browser snel te houden, accepteert SiteMark alleen een veilige deelverzameling: geen terugverwijzingen, geen lookarounds en geen geneste herhaling.

## Uitsluitpatronen en de tester

Uitsluitpatronen zetten een sitegroep uit voor sommige pagina’s, bijvoorbeeld productie behalve de statuspagina. Onder de patronen laat de URL-tester zien of een adres past, en welk patroon of welke uitsluiting de doorslag gaf.
