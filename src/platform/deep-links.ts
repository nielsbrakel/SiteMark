import { browser } from 'wxt/browser';
import type { Tabs } from '../app/ports';
import { formatOptionsRoute, type OptionsRoute, parseOptionsRoute } from '../core/options-route';

// Deep links into the options page (REQ-OPT-001): a new tab at options.html#<route>, for the
// openOptions content message (the picker's "More options…"), the popup and the welcome tab.

/** The options page at a route, e.g. `chrome-extension://<id>/options.html#/settings`. */
export function optionsPageUrl(route: OptionsRoute): string {
  return `${browser.runtime.getURL('/options.html')}#${formatOptionsRoute(route)}`;
}

/**
 * Opens the options page at `route` in a new tab (REQ-OPT-001). `false`, and nothing opens, for
 * anything but a known route: content scripts send it.
 */
export async function openOptions(tabs: Pick<Tabs, 'create'>, route: string): Promise<boolean> {
  const parsed = parseOptionsRoute(route);
  if (!parsed) return false;
  await tabs.create(optionsPageUrl(parsed));
  return true;
}
