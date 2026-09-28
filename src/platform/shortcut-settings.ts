import { browser } from 'wxt/browser';
import { notImplemented } from '../core/not-implemented';

/** Chromium browsers (Chrome, Edge, Brave, Opera) redirect this to their own shortcuts page. */
const CHROMIUM_SHORTCUTS = 'chrome://extensions/shortcuts';

/** Firefox ≥ 137 opens its shortcut manager itself; the typings don't know it yet. */
type WithShortcutSettings = { openShortcutSettings?: () => Promise<void> };

/**
 * Opens the browser's keyboard shortcut settings for extensions (REQ-OPT-004, REQ-CMD-001):
 * `commands.openShortcutSettings()` where the browser has it, else the Chromium shortcuts page.
 */
export async function openShortcutSettings(): Promise<void> {
  const commands = browser.commands as typeof browser.commands & WithShortcutSettings;
  try {
    if (commands.openShortcutSettings) return await commands.openShortcutSettings();
  } catch {
    // Refused (e.g. no user gesture): fall back to the page.
  }
  await browser.tabs.create({ url: CHROMIUM_SHORTCUTS });
}

export function canOpenShortcutSettings(): boolean {
  return notImplemented();
}
