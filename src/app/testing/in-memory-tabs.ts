import { err, ok } from '../../core/result';
import type { TabInfo, Tabs } from '../ports';

export type InMemoryTab = {
  readonly id: number;
  /** Leave it out for a tab SiteMark may not see (no grant, no activeTab). */
  readonly url?: string;
  readonly active?: boolean;
  /** A content script already listens in the tab. */
  readonly injected?: boolean;
  /** Injection fails, like on a browser or store page. */
  readonly restricted?: boolean;
};

export type SentMessage = { readonly tabId: number; readonly message: unknown };
export type Injection = { readonly tabId: number; readonly files: readonly string[] };

export type InMemoryTabs = Tabs & {
  /** Messages that reached a content script. */
  readonly sent: readonly SentMessage[];
  readonly injections: readonly Injection[];
  /** URLs of the tabs `create()` opened. */
  readonly created: readonly string[];
  /** How the content script in `tabId` answers messages (default: `undefined`). */
  respondWith(tabId: number, responder: (message: unknown) => unknown): void;
};

const info = ({ id, url }: InMemoryTab): TabInfo => (url === undefined ? { id } : { id, url });

/** A Tabs fake: only tabs with a content script get messages; restricted tabs refuse injection. */
export function createInMemoryTabs(tabs: readonly InMemoryTab[] = []): InMemoryTabs {
  const byId = new Map(tabs.map((tab) => [tab.id, tab]));
  const listening = new Set(tabs.filter((tab) => tab.injected).map((tab) => tab.id));
  const responders = new Map<number, (message: unknown) => unknown>();
  const sent: SentMessage[] = [];
  const injections: Injection[] = [];
  const created: string[] = [];
  return {
    list: async () => tabs.map(info),
    active: async () => {
      const tab = tabs.find((candidate) => candidate.active);
      return tab && info(tab);
    },
    sendMessage: async (tabId, message) => {
      if (!listening.has(tabId)) return err('noReceiver');
      sent.push({ tabId, message });
      return ok(responders.get(tabId)?.(message));
    },
    inject: async (tabId, files) => {
      const tab = byId.get(tabId);
      if (!tab || tab.restricted) return err('injectionFailed');
      injections.push({ tabId, files: [...files] });
      listening.add(tabId);
      return ok(undefined);
    },
    create: async (url) => {
      created.push(url);
    },
    sent,
    injections,
    created,
    respondWith: (tabId, responder) => void responders.set(tabId, responder),
  };
}
