import type { Browser } from 'wxt/browser';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import type {
  BackgroundMessageType,
  BackgroundProtocol,
  ContentMessageType,
  DataOf,
  PageMessageType,
} from '../../src/app/protocol';
import type { MarkId, SiteGroupId } from '../../src/core/ids';
import type { Hex } from '../../src/core/model/schema';
import type { TabStatus } from '../../src/core/render/status';

// Shared by the message-protocol tests (REQ-SEC-003): one valid payload per message, and the
// senders the background meets.

type Samples = { readonly [K in BackgroundMessageType]: DataOf<BackgroundProtocol, K> };

export const status: TabStatus = {
  marks: [{ markId: 'mark00000001' as MarkId, found: false }],
  favicon: 'unavailable',
  hidden: false,
};

export const validPayloads: Samples = {
  command: { type: 'createSiteGroup', name: 'Production' },
  getState: undefined,
  startPicker: { tabId: 7, repickMarkId: 'mark00000001' as MarkId },
  toggleHidden: { tabId: 7 },
  getTabStatus: { tabId: 7 },
  markThisSite: { tabId: 7, origin: { hostname: 'prod.example.com', port: '8443' } },
  importPreview: { text: '{"schemaVersion":1}' },
  importApply: { text: '{"schemaVersion":1}', mode: 'merge' },
  renderPlanFor: undefined,
  reportStatus: status,
  savePick: {
    selector: '#app > .header',
    siteGroupId: 'group0000001' as SiteGroupId,
    effects: ['outline', 'ribbon'],
    color: '#1f6feb' as Hex,
  },
  requestGrant: undefined,
  openOptions: { route: '/groups/group0000001' },
};

export const pageTypes: readonly PageMessageType[] = [
  'command',
  'getState',
  'startPicker',
  'toggleHidden',
  'getTabStatus',
  'markThisSite',
  'importPreview',
  'importApply',
];

export const contentTypes: readonly ContentMessageType[] = [
  'renderPlanFor',
  'reportStatus',
  'savePick',
  'requestGrant',
  'openOptions',
];

/** `chrome-extension://test-extension-id/` in the fake browser. */
export const extensionUrl = (path: string): string => `${fakeBrowser.runtime.getURL('/')}${path}`;

type SenderFields = {
  id?: string | undefined;
  url?: string | undefined;
  tab?: { id?: number | undefined } | undefined;
  frameId?: number | undefined;
};

export const sender = (fields: SenderFields): Browser.runtime.MessageSender =>
  fields as Browser.runtime.MessageSender;

export const senders = {
  popup: () => sender({ id: fakeBrowser.runtime.id, url: extensionUrl('popup.html') }),
  optionsTab: () =>
    sender({
      id: fakeBrowser.runtime.id,
      url: extensionUrl('options.html'),
      tab: { id: 3 },
      frameId: 0,
    }),
  background: () => sender({ id: fakeBrowser.runtime.id, url: extensionUrl('background.js') }),
  content: (url = 'https://prod.example.com:8443/app?x=1#top') =>
    sender({ id: fakeBrowser.runtime.id, url, tab: { id: 7 }, frameId: 0 }),
};
