import { browser } from 'wxt/browser';

/** Chromium browsers (Chrome, Edge, Brave, Opera) redirect this to their own shortcuts page. */
const CHROMIUM_SHORTCUTS = 'chrome://extensions/shortcuts';

/** Firefox ≥ 137 opens its shortcut manager itself; the typings don't know it yet. */
type WithShortcutSettings = { openShortcutSettings?: () => Promise<void> };

const commandsApi = () => browser.commands as typeof browser.commands & WithShortcutSettings;

/** Only Chromium serves extension pages from `chrome-extension:`; Safari can't open chrome://. */
const isChromium = () => browser.runtime.getURL('/').startsWith('chrome-extension:');

/** Can this browser open its shortcut settings for us (the API, or the Chromium page)? */
export function canOpenShortcutSettings(): boolean {
  return Boolean(commandsApi().openShortcutSettings) || isChromium();
}

async function openChromiumPage(): Promise<boolean> {
  if (!isChromium()) return false;
  try {
    await browser.tabs.create({ url: CHROMIUM_SHORTCUTS });
    return true;
  } catch {
    return false;
  }
}

/**
 * Opens the browser's keyboard shortcut settings for extensions (REQ-OPT-004, REQ-CMD-001):
 * `commands.openShortcutSettings()` where the browser has it, else the Chromium shortcuts page.
 * Never rejects: resolves `false` when nothing could be opened (e.g. Safari), so the page can say
 * where to look instead.
 */
export async function openShortcutSettings(): Promise<boolean> {
  const commands = commandsApi();
  try {
    if (commands.openShortcutSettings) {
      await commands.openShortcutSettings();
      return true;
    }
  } catch {
    // Refused (e.g. no user gesture): fall back to the page.
  }
  return openChromiumPage();
}
