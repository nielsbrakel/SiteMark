---
title: Import and export
description: Move your site groups to another browser or share them with your team.
order: 7
---

Your site groups are stored in your browser only. To use them in another browser, or to give your team the same marks, export them to a file and import that file.

## Export

Open **Settings**, then **Data**, and click **Export**. SiteMark downloads a file named like `sitemark-export-2026-09-28.json` with all your site groups and settings. You can also export a single site group from its editor.

The file contains the addresses of the sites you mark, which may include internal host names. Treat it like any other internal document.

## Import

On the **Data** page, choose a file to import. SiteMark checks it first and shows a preview: how many site groups are new, how many are updated, and which sites will need access. Regular expressions are highlighted, so you can review them before you trust someone else's file. A file that isn't valid shows what is wrong and changes nothing.

Then choose how to import:

- **Merge** adds new site groups and updates the ones you already have, and keeps your own settings.
- **Replace** swaps all your site groups and settings for the file's, after you confirm.

After the import, your browser asks once for access to all new sites.

## Start over

**Reset everything** on the same page deletes all site groups and settings, after a double confirmation, and can give back the access to every site at the same time. Export first if you might want your site groups back.
