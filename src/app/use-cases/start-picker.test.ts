import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MarkId } from '../../core/ids';
import { err, ok } from '../../core/result';
import { createInMemoryBadge } from '../testing/in-memory-badge';
import { createInMemoryTabs, type InMemoryTab } from '../testing/in-memory-tabs';
import { flashRestricted, startPicker } from './start-picker';

const PICKER = ['content-scripts/picker.js'];
const markId = 'mark00000004' as MarkId;

function setup(tab: InMemoryTab = { id: 7 }) {
  const tabs = createInMemoryTabs([tab]);
  const badge = createInMemoryBadge();
  return { tabs, badge, deps: { tabs, badge, pickerFiles: PICKER } };
}

describe('REQ-PICK-001 the picker is injected on demand into the tab', () => {
  it('injects the picker files', async () => {
    const { deps, tabs } = setup();
    expect(await startPicker(deps, { tabId: 7 })).toEqual(ok(undefined));
    expect(tabs.injections).toEqual([{ tabId: 7, files: PICKER }]);
    expect(tabs.sent).toEqual([]);
  });

  it('reports a page where it can not run (REQ-POP-005)', async () => {
    const { deps, tabs } = setup({ id: 7, restricted: true });
    expect(await startPicker(deps, { tabId: 7, repickMarkId: markId })).toEqual(
      err('injectionFailed'),
    );
    expect(tabs.sent).toEqual([]);
  });
});

describe('REQ-PICK-007 a re-pick tells the new picker which mark it replaces', () => {
  it('sends the mark ID to the picker right after injecting it', async () => {
    const { deps, tabs } = setup();
    await startPicker(deps, { tabId: 7, repickMarkId: markId });
    expect(tabs.sent).toEqual([{ tabId: 7, message: { type: 'repick', data: { markId } } }]);
  });
});

describe('REQ-CMD-001 a "✕" badge briefly marks a page where the shortcut can not run', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows "✕" and clears it after 2 seconds', async () => {
    const { badge } = setup();
    await flashRestricted(badge, 7);
    expect(badge.textOf(7)).toBe('✕');
    await vi.advanceTimersByTimeAsync(1999);
    expect(badge.textOf(7)).toBe('✕');
    await vi.advanceTimersByTimeAsync(1);
    expect(badge.textOf(7)).toBe('');
  });
});
