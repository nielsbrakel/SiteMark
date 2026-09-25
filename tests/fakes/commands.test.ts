import { describe, expect, it, vi } from 'vitest';
import { createFakeCommands } from './commands';

describe('REQ-NFR-004 fake commands expose shortcuts and fire onCommand', () => {
  it('lists commands, including unassigned ones', async () => {
    const fake = createFakeCommands([
      { name: 'start-picker', shortcut: 'Alt+Shift+M' },
      { name: 'toggle-hide', shortcut: '' },
    ]);
    fake.setShortcut('toggle-hide', 'Alt+Shift+H');
    await expect(fake.api.getAll()).resolves.toEqual([
      { name: 'start-picker', shortcut: 'Alt+Shift+M' },
      { name: 'toggle-hide', shortcut: 'Alt+Shift+H' },
    ]);
  });

  it('fires onCommand with the active tab when a shortcut is pressed', () => {
    const fake = createFakeCommands([{ name: 'start-picker', shortcut: 'Alt+Shift+M' }]);
    const listener = vi.fn();
    fake.api.onCommand.addListener(listener);
    fake.press('start-picker', { id: 7 });
    expect(listener).toHaveBeenCalledWith('start-picker', { id: 7 });
  });
});
