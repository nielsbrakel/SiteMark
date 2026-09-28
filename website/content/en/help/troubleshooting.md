---
title: Troubleshooting
description: What to check when marks don’t show, or show where they shouldn’t.
order: 8
---

Most problems have a short list of causes. Start with the popup: open it on the page in question, and it tells you which site groups match and what is missing.

## The marks don't show

- **No site group matches.** The popup says so. Check the patterns in the settings with the URL tester.
- **The site group is disabled.** The popup lists it as disabled, with a link to the settings, where you can switch it on.
- **Access is not granted.** The popup shows **Allow**. Without access, marks only appear after you open the popup.
- **The page is off limits.** Browser settings pages, extension stores, the PDF viewer and local files can't run extensions, and the popup says SiteMark can't run on this page.
- **The page is inside a frame.** SiteMark marks top-level pages only.
- **The marks are hidden.** Hide on this tab was pressed; press it again.

## An element mark is missing

The popup lists element marks as found or not found. When the page was rebuilt, press **Re-pick** and choose the element again. A toolbar badge with an exclamation mark means something on this tab could not be shown completely.

## Marks show where they shouldn't

Another pattern may match more than you expect. The URL tester names the pattern that matched. Add an exclude pattern, or make the pattern more specific.

## Still stuck?

Copy the diagnostics from the settings page (they contain no page addresses beyond the sites themselves) and open an issue on GitHub. The support page lists what else helps us help you.
