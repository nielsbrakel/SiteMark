import { describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { createInMemoryTabs } from '../app/testing/in-memory-tabs';
import { openOptions, optionsPageUrl } from './deep-links';

const page = () => fakeBrowser.runtime.getURL('/options.html');

describe('REQ-OPT-001 deep links open the options page at a route', () => {
  it('builds the options page URL with the route as its hash', () => {
    expect(optionsPageUrl({ page: 'welcome' })).toBe(`${page()}#/welcome`);
  });

  it.each([
    '/groups/group0000001',
    '/groups/group0000001/marks/mark00000001',
    '/settings',
    '/data',
    '/welcome',
  ])('opens a new tab at %s', async (route) => {
    const tabs = createInMemoryTabs();
    expect(await openOptions(tabs, route)).toBe(true);
    expect(tabs.created).toEqual([`${page()}#${route}`]);
  });

  it.each(['', '/admin', 'https://evil.example/', '/groups/x#y', 'javascript:alert(1)'])(
    'opens nothing for the unknown route %j',
    async (route) => {
      const tabs = createInMemoryTabs();
      expect(await openOptions(tabs, route)).toBe(false);
      expect(tabs.created).toEqual([]);
    },
  );
});
