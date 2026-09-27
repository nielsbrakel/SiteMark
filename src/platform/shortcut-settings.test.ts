import { describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { openShortcutSettings } from './shortcut-settings';

describe('REQ-OPT-004 opening the browser’s keyboard shortcut settings', () => {
  it('uses commands.openShortcutSettings where the browser has it (Firefox)', async () => {
    const open = vi.fn(async () => undefined);
    Object.assign(fakeBrowser.commands, { openShortcutSettings: open });
    const create = vi.spyOn(fakeBrowser.tabs, 'create');
    await openShortcutSettings();
    expect(open).toHaveBeenCalledOnce();
    expect(create).not.toHaveBeenCalled();
  });

  it('opens the shortcuts page in a new tab elsewhere (Chromium)', async () => {
    const create = vi.spyOn(fakeBrowser.tabs, 'create');
    await openShortcutSettings();
    expect(create).toHaveBeenCalledWith({ url: 'chrome://extensions/shortcuts' });
  });

  it('falls back to the tab when the browser refuses', async () => {
    const open = vi.fn(async () => {
      throw new Error('not allowed');
    });
    Object.assign(fakeBrowser.commands, { openShortcutSettings: open });
    const create = vi.spyOn(fakeBrowser.tabs, 'create');
    await openShortcutSettings();
    expect(create).toHaveBeenCalledWith({ url: 'chrome://extensions/shortcuts' });
  });
});
