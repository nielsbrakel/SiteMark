import { describe, expect, it } from 'vitest';
import type { MarkId } from '../../core/ids';
import type { TabStatus } from '../../core/render/status';
import { err, ok } from '../../core/result';
import { createInMemoryTabs } from '../testing/in-memory-tabs';
import { requestTabStatus } from './tab-status';

const status: TabStatus = {
  marks: [{ markId: 'mark00000001' as MarkId, found: true }],
  favicon: 'off',
  hidden: true,
};

describe('REQ-SEC-003 REQ-POP-002 the background validates the status a content script answers', () => {
  it('asks the tab with getStatus and returns the validated answer', async () => {
    const tabs = createInMemoryTabs([{ id: 4, url: 'https://prod.example.com/', injected: true }]);
    tabs.respondWith(4, () => status);
    await expect(requestTabStatus(tabs, 4)).resolves.toEqual(ok(status));
    expect(tabs.sent).toEqual([{ tabId: 4, message: { type: 'getStatus' } }]);
  });

  it('reports noReceiver for a tab without a content script', async () => {
    const tabs = createInMemoryTabs([{ id: 4 }]);
    await expect(requestTabStatus(tabs, 4)).resolves.toEqual(err('noReceiver'));
  });

  it.each([
    ['nothing', undefined],
    ['a string', 'all good'],
    ['an extra key', { ...status, url: 'https://prod.example.com/' }],
    ['an invalid mark ID', { ...status, marks: [{ markId: '<b>', found: true }] }],
  ])('refuses an answer that is %s', async (_name, answer) => {
    const tabs = createInMemoryTabs([{ id: 4, injected: true }]);
    tabs.respondWith(4, () => answer);
    await expect(requestTabStatus(tabs, 4)).resolves.toEqual(err('invalidResponse'));
  });
});
