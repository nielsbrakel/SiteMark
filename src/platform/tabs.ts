import type { Logger, Tabs } from '../app/ports';
import { notImplemented } from '../core/not-implemented';

/** The Tabs adapter over `browser.tabs` and `browser.scripting`; it never rejects. */
export function createTabs(_logger: Logger): Tabs {
  return notImplemented();
}
