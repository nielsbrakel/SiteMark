---
title: Picking an element
description: Mark one button or field on a page with the element picker.
order: 4
---

Besides the whole page, SiteMark can mark one element: the delete button you never want to press by accident, or the field that sends email to real customers.

## Start the picker

Click **Pick element** in the popup, or press the shortcut (Alt+Shift+M unless you changed it). The picker works on any page where extensions may run, even before SiteMark has access to the site.

While the picker is on, a dashed outline follows your pointer and a small label names the element under it. Nothing on the page reacts: clicks, hovers and key presses go to the picker only, so you can't trigger the button you are marking.

## Choose with the mouse or the keyboard

Click to choose the highlighted element. With the keyboard, start from the focused element, move to the parent with the up arrow, to the first child with the down arrow and to siblings with the left and right arrows. Press Enter to choose and Escape to cancel.

## Save the mark

After you choose, a small panel shows the selector SiteMark wrote for the element, the site group to save it in, the effects (an outline by default) and the color. Click **Save**, or **More options…** to continue in the mark editor.

If SiteMark doesn't have access to the site yet, the mark shows on this tab only, with an **Allow** button to keep it.

## When the page changes

SiteMark marks the first element that matches the selector. If the page is rebuilt and the element can't be found, the popup reports it as not found and offers **Re-pick**. Inside an iframe the picker marks the whole frame, and inside a web component its host element.
