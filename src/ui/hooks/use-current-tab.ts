import { useEffect, useState } from 'react';
import { browser } from 'wxt/browser';

export type CurrentTab =
  | { readonly status: 'loading' }
  /** `url` is only known when the browser grants it (activeTab, once the popup opens). */
  | { readonly status: 'ready'; readonly tabId: number; readonly url: string | undefined }
  | { readonly status: 'none' };

const NONE: CurrentTab = { status: 'none' };

/** Chromium tab ids are positive 32-bit integers, often ten digits long. */
const MAX_TAB_ID = 2 ** 31 - 1;

/** `?tabId=` lets Playwright open the popup for a given tab; only e2e builds honour it (plan §5). */
function e2eTabId(search: string): number | undefined {
  if (import.meta.env.MODE !== 'e2e') return undefined;
  const raw = new URLSearchParams(search).get('tabId') ?? '';
  const id = /^\d{1,10}$/.test(raw) ? Number(raw) : Number.NaN;
  return id <= MAX_TAB_ID ? id : undefined;
}

async function findTab(search: string): Promise<CurrentTab> {
  try {
    const forced = e2eTabId(search);
    const tab =
      forced === undefined
        ? (await browser.tabs.query({ active: true, currentWindow: true }))[0]
        : await browser.tabs.get(forced);
    return tab?.id === undefined ? NONE : { status: 'ready', tabId: tab.id, url: tab.url };
  } catch {
    return NONE;
  }
}

/** The tab the popup acts on: the active tab of the current window. */
export function useCurrentTab(search: string = location.search): CurrentTab {
  const [tab, setTab] = useState<CurrentTab>({ status: 'loading' });
  useEffect(() => {
    let isCurrent = true;
    void findTab(search).then((found) => {
      if (isCurrent) setTab(found);
    });
    return () => {
      isCurrent = false;
    };
  }, [search]);
  return tab;
}
