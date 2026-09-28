import { describe, expect, it } from 'vitest';
import type { ContentSender } from '../protocol';
import { createInMemoryPermissions } from '../testing/in-memory-permissions';
import { createInMemoryTabs } from '../testing/in-memory-tabs';
import { isSenderGranted, showOnTab } from './picked-tab';

const sender: ContentSender = {
  tabId: 7,
  url: 'https://shop.example.com:8443/cart',
  origin: 'https://shop.example.com:8443',
};

const MARKER = ['marker.js'];

describe('REQ-PICK-006 the panel knows whether the site is granted', () => {
  it('is granted when the host is', async () => {
    const permissions = createInMemoryPermissions(['*://shop.example.com/*']);
    expect(await isSenderGranted(permissions, sender)).toBe(true);
  });

  it('is not granted for another host', async () => {
    const permissions = createInMemoryPermissions(['*://other.example.com/*']);
    expect(await isSenderGranted(permissions, sender)).toBe(false);
  });
});

describe('REQ-PICK-006 a saved pick shows on the tab at once', () => {
  it('injects the marker through activeTab when none runs in the tab', async () => {
    const tabs = createInMemoryTabs([{ id: 7, url: sender.url }]);
    await showOnTab({ tabs, markerFiles: MARKER }, 7);
    expect(tabs.injections).toEqual([{ tabId: 7, files: MARKER }]);
  });

  it('leaves a running marker alone: the commit already pushed its new plan', async () => {
    const tabs = createInMemoryTabs([{ id: 7, url: sender.url, injected: true }]);
    tabs.respondWith(7, () => ({ marks: [], favicon: 'off', hidden: false }));
    await showOnTab({ tabs, markerFiles: MARKER }, 7);
    expect(tabs.injections).toEqual([]);
  });
});
