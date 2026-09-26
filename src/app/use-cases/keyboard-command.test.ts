import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TabStatus } from '../../core/render/status';
import { createInMemoryBadge } from '../testing/in-memory-badge';
import { createInMemoryTabs, type InMemoryTab } from '../testing/in-memory-tabs';
import { runKeyboardCommand } from './keyboard-command';

const PICKER = ['content-scripts/picker.js'];

function setup(tab: InMemoryTab) {
  const tabs = createInMemoryTabs([tab]);
  const badge = createInMemoryBadge();
  return { tabs, badge, deps: { tabs, badge, pickerFiles: PICKER } };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('REQ-CMD-001 start-picker starts the picker on the tab', () => {
  it('injects the picker', async () => {
    const { deps, tabs, badge } = setup({ id: 3 });
    await runKeyboardCommand(deps, 'start-picker', 3);
    expect(tabs.injections).toEqual([{ tabId: 3, files: PICKER }]);
    expect(badge.textOf(3)).toBe('');
  });

  it('briefly shows "✕" where it can not run', async () => {
    vi.useFakeTimers();
    const { deps, badge } = setup({ id: 3, restricted: true });
    await runKeyboardCommand(deps, 'start-picker', 3);
    expect(badge.textOf(3)).toBe('✕');
    await vi.advanceTimersByTimeAsync(2000);
    expect(badge.textOf(3)).toBe('');
  });
});

describe('REQ-CMD-002 toggle-hide toggles "Hide on this tab"', () => {
  it('flips the hidden state of the marker in the tab', async () => {
    const { deps, tabs } = setup({ id: 3, injected: true });
    const shown: TabStatus = { marks: [], favicon: 'off', hidden: false };
    tabs.respondWith(3, () => shown);
    await runKeyboardCommand(deps, 'toggle-hide', 3);
    expect(tabs.sent.at(-1)).toEqual({
      tabId: 3,
      message: { type: 'setHidden', data: { hidden: true } },
    });
  });
});
