import { describe, expect, it } from 'vitest';
import { browser } from 'wxt/browser';
import { fakes } from './install';

describe('REQ-NFR-004 the fakes are installed on the fake browser for every dom test', () => {
  it('routes browser.permissions, scripting, i18n and commands to the fakes', async () => {
    fakes().permissions.grant('*://prod.example.com/*');
    await expect(
      browser.permissions.contains({ origins: ['*://prod.example.com/*'] }),
    ).resolves.toBe(true);
    expect(browser.i18n.getMessage('extName')).toBe('SiteMark');
    await expect(browser.scripting.getRegisteredContentScripts()).resolves.toEqual([]);
    await expect(browser.commands.getAll()).resolves.toEqual([]);
  });

  it('starts every test from a clean state', async () => {
    expect(fakes().permissions.granted).toEqual([]);
    await expect(browser.permissions.getAll()).resolves.toEqual({ permissions: [], origins: [] });
  });

  it('keeps the upstream action fake for per-tab badges', async () => {
    await browser.action.setBadgeText({ tabId: 3, text: '!' });
    await expect(browser.action.getBadgeText({ tabId: 3 })).resolves.toBe('!');
  });
});
