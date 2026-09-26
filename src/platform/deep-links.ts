import type { Tabs } from '../app/ports';
import { notImplemented } from '../core/not-implemented';
import type { OptionsRoute } from '../core/options-route';

/** The options page at a route, e.g. `chrome-extension://<id>/options.html#/settings`. */
export function optionsPageUrl(_route: OptionsRoute): string {
  return notImplemented();
}

/** Opens the options page at `route` in a new tab (REQ-OPT-001). */
export async function openOptions(_tabs: Pick<Tabs, 'create'>, _route: string): Promise<boolean> {
  return notImplemented();
}
