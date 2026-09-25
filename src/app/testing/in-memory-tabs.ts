import { notImplemented } from '../../core/not-implemented';
import type { Tabs } from '../ports';

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

/** A Tabs fake: only tabs with a content script get messages; restricted tabs refuse injection. */
export function createInMemoryTabs(_tabs: readonly InMemoryTab[] = []): InMemoryTabs {
  return notImplemented();
}
