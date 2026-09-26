import { type Browser, browser } from 'wxt/browser';
import type { ScriptPublicPath } from 'wxt/utils/inject-script';
import type { Logger, TabInfo, Tabs } from '../app/ports';
import { err, ok } from '../core/result';

// No `tabs` permission: the browser reveals a tab's URL only for granted origins and activeTab,
// so `url` is simply absent for every other tab.

function toInfo({ id, url }: Browser.tabs.Tab): TabInfo[] {
  if (id === undefined) return [];
  return [url === undefined ? { id } : { id, url }];
}

/** The Tabs adapter over `browser.tabs` and `browser.scripting`; it never rejects. */
export function createTabs(logger: Logger): Tabs {
  const query = async (info: Browser.tabs.QueryInfo): Promise<TabInfo[]> => {
    try {
      return (await browser.tabs.query(info)).flatMap(toInfo);
    } catch (error) {
      logger.warn('Could not list the tabs', error);
      return [];
    }
  };
  return {
    list: () => query({}),
    active: async () => (await query({ active: true, lastFocusedWindow: true }))[0],
    sendMessage: (tabId, message) =>
      // Top frame only: the marker never runs in subframes (allFrames: false).
      browser.tabs.sendMessage(tabId, message, { frameId: 0 }).then(
        (answer: unknown) => ok(answer),
        () => err('noReceiver' as const),
      ),
    inject: (tabId, files) =>
      // The port takes plain paths (tests/build checks the marker's); a bad one fails the call.
      browser.scripting
        .executeScript({ target: { tabId }, files: [...files] as ScriptPublicPath[] })
        .then(
          () => ok(undefined),
          () => err('injectionFailed' as const),
        ),
    create: async (url) => {
      try {
        await browser.tabs.create({ url });
      } catch (error) {
        logger.warn('Could not open a tab', error);
      }
    },
  };
}
