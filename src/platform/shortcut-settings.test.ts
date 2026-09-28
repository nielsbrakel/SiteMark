import { describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { canOpenShortcutSettings, openShortcutSettings } from './shortcut-settings';

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

  it('resolves true once a settings page opened', async () => {
    expect(await openShortcutSettings()).toBe(true);
  });
});

describe('REQ-OPT-004 no chrome:// fallback outside Chromium (Safari)', () => {
  const onSafari = () =>
    vi
      .spyOn(fakeBrowser.runtime, 'getURL')
      .mockImplementation((path) => `safari-web-extension://abc${String(path)}`);

  it('can open the settings with the API or on Chromium, not elsewhere', () => {
    expect(canOpenShortcutSettings()).toBe(true);
    onSafari();
    expect(canOpenShortcutSettings()).toBe(false);
    Object.assign(fakeBrowser.commands, { openShortcutSettings: vi.fn(async () => undefined) });
    expect(canOpenShortcutSettings()).toBe(true);
  });

  it('opens no chrome:// tab without the API outside Chromium, and resolves false', async () => {
    onSafari();
    const create = vi.spyOn(fakeBrowser.tabs, 'create');
    expect(await openShortcutSettings()).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });

  it('resolves false when the API refuses outside Chromium', async () => {
    onSafari();
    const open = vi.fn(async () => {
      throw new Error('not allowed');
    });
    Object.assign(fakeBrowser.commands, { openShortcutSettings: open });
    const create = vi.spyOn(fakeBrowser.tabs, 'create');
    expect(await openShortcutSettings()).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });

  it('never rejects, even when the tab can’t be opened', async () => {
    vi.spyOn(fakeBrowser.tabs, 'create').mockRejectedValue(new Error('Illegal URL'));
    expect(await openShortcutSettings().catch(() => 'rejected')).toBe(false);
  });
});
