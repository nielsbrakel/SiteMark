import { describe, expect, it, type MockInstance, vi } from 'vitest';
import { type Browser, browser } from 'wxt/browser';
import { fakes } from '../../tests/fakes/install';
import { createInMemoryLogger } from '../app/testing/in-memory-logger';
import { createTabs } from './tabs';

const FILES = ['content-scripts/content.js'];

const tab = (fields: Partial<Browser.tabs.Tab>) => fields as Browser.tabs.Tab;

// The browser APIs are overloaded (promise and callback); spy on the promise form.
type Query = (info: Browser.tabs.QueryInfo) => Promise<Browser.tabs.Tab[]>;
type Send = (tabId: number, message: unknown, options: object) => Promise<unknown>;
const spyOnQuery = () => vi.spyOn(browser.tabs, 'query') as unknown as MockInstance<Query>;
const spyOnSend = () => vi.spyOn(browser.tabs, 'sendMessage') as unknown as MockInstance<Send>;

const setup = () => {
  const logger = createInMemoryLogger();
  return { tabs: createTabs(logger), logger };
};

describe('REQ-POP-007 REQ-PRIV-002 the Tabs adapter sees only what SiteMark may see', () => {
  it('lists every tab with an id, with the URL only where the browser reveals it', async () => {
    const query = spyOnQuery().mockResolvedValueOnce([
      tab({ id: 1, url: 'https://prod.example.com/' }),
      tab({ id: 2 }),
      tab({ url: 'devtools://devtools/' }),
    ]);
    await expect(setup().tabs.list()).resolves.toEqual([
      { id: 1, url: 'https://prod.example.com/' },
      { id: 2 },
    ]);
    expect(query).toHaveBeenCalledWith({});
  });

  it('finds the active tab of the last focused window', async () => {
    const query = spyOnQuery();
    query.mockResolvedValueOnce([tab({ id: 4, url: 'https://prod.example.com/' })]);
    const { tabs } = setup();
    await expect(tabs.active()).resolves.toEqual({ id: 4, url: 'https://prod.example.com/' });
    expect(query).toHaveBeenCalledWith({ active: true, lastFocusedWindow: true });
    query.mockResolvedValueOnce([]);
    await expect(tabs.active()).resolves.toBeUndefined();
  });

  it('answers with no tabs when the browser fails, and logs it', async () => {
    const broken = new Error('tabs unavailable');
    spyOnQuery().mockRejectedValue(broken);
    const { tabs, logger } = setup();
    await expect(tabs.list()).resolves.toEqual([]);
    await expect(tabs.active()).resolves.toBeUndefined();
    expect(logger.entries.map(({ level, detail }) => [level, detail])).toEqual([
      ['warn', broken],
      ['warn', broken],
    ]);
  });

  it('messages the top frame of a tab and returns its answer', async () => {
    const send = spyOnSend().mockResolvedValueOnce({ pong: true });
    await expect(setup().tabs.sendMessage(4, { type: 'ping' })).resolves.toEqual({
      ok: true,
      value: { pong: true },
    });
    expect(send).toHaveBeenCalledWith(4, { type: 'ping' }, { frameId: 0 });
  });

  it('reports noReceiver when no content script listens', async () => {
    spyOnSend().mockRejectedValueOnce(
      new Error('Could not establish connection. Receiving end does not exist.'),
    );
    await expect(setup().tabs.sendMessage(4, {})).resolves.toEqual({
      ok: false,
      error: 'noReceiver',
    });
  });

  it('injects extension files into the top frame', async () => {
    await expect(setup().tabs.inject(4, FILES)).resolves.toEqual({ ok: true, value: undefined });
    expect(fakes().scripting.injections).toEqual([{ tabId: 4, files: FILES }]);
  });

  it('reports injectionFailed on a page scripts cannot run on', async () => {
    fakes().scripting.failInjection(4, 'Cannot access contents of the page.');
    await expect(setup().tabs.inject(4, FILES)).resolves.toEqual({
      ok: false,
      error: 'injectionFailed',
    });
  });

  it('opens a tab, and logs instead of rejecting when it cannot', async () => {
    const create = vi.spyOn(browser.tabs, 'create');
    const { tabs, logger } = setup();
    await tabs.create('chrome-extension://test-extension-id/grant.html');
    expect(create).toHaveBeenCalledWith({ url: 'chrome-extension://test-extension-id/grant.html' });
    const broken = new Error('window closed');
    create.mockRejectedValueOnce(broken);
    await expect(tabs.create('https://example.com/')).resolves.toBeUndefined();
    expect(logger.entries).toEqual([
      { level: 'warn', message: 'Could not open a tab', detail: broken },
    ]);
  });
});
