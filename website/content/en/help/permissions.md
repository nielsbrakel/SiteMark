---
title: Permissions explained
description: Why SiteMark asks for access to a site, and what it does with it.
order: 6
---

SiteMark is built to know as little as possible. It asks for access to a website only when you mark it, and only for that site.

## What SiteMark asks for at install

- **Storage:** to keep your site groups in your browser.
- **Scripting:** to draw marks on the sites you allowed.
- **Active tab:** to let the popup and the picker work on the tab you are looking at, only after you click or press the shortcut.

It asks for no access to any website at install, so the store shows no warning about reading your data on all sites.

## Access per site

When you add a pattern, or press **Mark this site**, your browser asks whether SiteMark may access that site. SiteMark needs this to show your marks on every visit, without you opening the popup first. Next to each pattern the settings show **Granted**, or **Not granted** with an **Allow** button.

If you deny it, the site group still exists, and the popup explains what is missing. You can allow it later, or remove access in your browser's extension settings at any time; SiteMark then shows the site as not granted.

When you remove a site group or a pattern, SiteMark offers to give back the access that nothing uses any more.

## What SiteMark does with access

It draws the marks and does nothing else. SiteMark makes no network requests of its own, has no analytics and never sends your site groups anywhere. The one exception is the opt-in favicon tint, which loads the site's own icon. A page could detect that marks were added to it. The privacy policy explains all of this.
