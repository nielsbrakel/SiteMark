import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { useCurrentTab } from './use-current-tab';

// The fake browser starts without a focused window; the popup's window is the current one.
beforeEach(async () => {
  await fakeBrowser.windows.create({ focused: true });
});

const openTab = (url?: string, active = false) =>
  fakeBrowser.tabs.create(url === undefined ? { active } : { url, active });

async function settled(search = '') {
  const { result } = renderHook(() => useCurrentTab(search));
  expect(result.current).toEqual({ status: 'loading' });
  await waitFor(() => expect(result.current.status).not.toBe('loading'));
  return result.current;
}

describe('REQ-POP-001 the popup works on the active tab of the current window', () => {
  it('reads the active tab id and its URL', async () => {
    await openTab('https://other.example.com/');
    const active = await openTab('https://app.example.com/orders', true);
    expect(await settled()).toEqual({
      status: 'ready',
      tabId: active.id,
      url: 'https://app.example.com/orders',
    });
  });

  it('has no URL when the browser withholds it (no activeTab grant)', async () => {
    const active = await openTab(undefined, true);
    expect(await settled()).toEqual({ status: 'ready', tabId: active.id, url: undefined });
  });

  it('reports no tab when there is no active tab', async () => {
    expect(await settled()).toEqual({ status: 'none' });
  });

  it('reports no tab when the query fails', async () => {
    vi.spyOn(fakeBrowser.tabs, 'query').mockRejectedValueOnce(new Error('no window'));
    expect(await settled()).toEqual({ status: 'none' });
  });

  it('ignores ?tabId= outside e2e builds', async () => {
    const active = await openTab('https://app.example.com/', true);
    const other = await openTab('https://other.example.com/');
    expect(await settled(`?tabId=${other.id}`)).toMatchObject({ tabId: active.id });
  });

  it('honours ?tabId= in e2e builds, for Playwright', async () => {
    vi.stubEnv('MODE', 'e2e');
    await openTab('https://app.example.com/', true);
    const other = await openTab('https://other.example.com/');
    expect(await settled(`?tabId=${other.id}`)).toEqual({
      status: 'ready',
      tabId: other.id,
      url: 'https://other.example.com/',
    });
  });

  it('falls back to the active tab for an unusable ?tabId= in e2e builds', async () => {
    vi.stubEnv('MODE', 'e2e');
    const active = await openTab('https://app.example.com/', true);
    expect(await settled('?tabId=abc')).toMatchObject({ tabId: active.id });
  });

  it('reports no tab for an e2e ?tabId= that does not exist', async () => {
    vi.stubEnv('MODE', 'e2e');
    await openTab('https://app.example.com/', true);
    expect(await settled('?tabId=999')).toEqual({ status: 'none' });
  });
});
