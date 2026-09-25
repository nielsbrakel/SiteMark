import { describe, expect, it } from 'vitest';
import { createFakeScripting } from './scripting';

const marker = { id: 'sitemark-marker', matches: ['*://prod.example.com/*'], js: ['content.js'] };

describe('REQ-NFR-004 fake scripting keeps registrations and injections', () => {
  it('registers, lists, updates and unregisters content scripts', async () => {
    const { api } = createFakeScripting();
    await api.registerContentScripts([marker]);
    await expect(api.getRegisteredContentScripts()).resolves.toEqual([marker]);
    await api.updateContentScripts([{ id: marker.id, matches: ['*://a.example.com/*'] }]);
    await expect(api.getRegisteredContentScripts({ ids: [marker.id] })).resolves.toEqual([
      { ...marker, matches: ['*://a.example.com/*'] },
    ]);
    await api.unregisterContentScripts({ ids: [marker.id] });
    await expect(api.getRegisteredContentScripts()).resolves.toEqual([]);
  });

  it('rejects duplicate and unknown script IDs like Chromium', async () => {
    const { api } = createFakeScripting();
    await api.registerContentScripts([marker]);
    await expect(api.registerContentScripts([marker])).rejects.toThrow(/Duplicate script ID/);
    await expect(api.updateContentScripts([{ id: 'nope' }])).rejects.toThrow(
      /Nonexistent script ID/,
    );
    await expect(api.unregisterContentScripts({ ids: ['nope'] })).rejects.toThrow(/Nonexistent/);
  });

  it('unregisters everything without a filter', async () => {
    const fake = createFakeScripting();
    await fake.api.registerContentScripts([marker, { ...marker, id: 'other' }]);
    await fake.api.unregisterContentScripts();
    expect(fake.registered).toEqual([]);
  });

  it('records injections and fails them on tabs marked restricted', async () => {
    const fake = createFakeScripting();
    await expect(
      fake.api.executeScript({ target: { tabId: 1 }, files: ['picker.js'] }),
    ).resolves.toEqual([{ frameId: 0, result: undefined }]);
    fake.failInjection(2, 'Cannot access a chrome:// URL');
    await expect(
      fake.api.executeScript({ target: { tabId: 2 }, files: ['picker.js'] }),
    ).rejects.toThrow('Cannot access a chrome:// URL');
    expect(fake.injections).toEqual([{ tabId: 1, files: ['picker.js'] }]);
  });
});
