import { describe, expect, it } from 'vitest';
import type { TabStatus } from '../../core/render/status';
import { createInMemoryTabs } from '../testing/in-memory-tabs';
import { toggleHidden } from './toggle-hidden';

const status = (hidden: boolean): TabStatus => ({ marks: [], favicon: 'off', hidden });

function tabAnswering(answer: unknown) {
  const tabs = createInMemoryTabs([{ id: 7, injected: true }]);
  tabs.respondWith(7, (message) =>
    (message as { type: string }).type === 'getStatus' ? answer : undefined,
  );
  return tabs;
}

const setHiddenSent = (tabs: ReturnType<typeof tabAnswering>) =>
  tabs.sent.filter(({ message }) => (message as { type: string }).type === 'setHidden');

describe('REQ-CMD-002 REQ-RND-008 toggle-hide flips "Hide on this tab" in the marker', () => {
  it.each([
    [false, true],
    [true, false],
  ])('hidden %s → %s', async (hidden, next) => {
    const tabs = tabAnswering(status(hidden));
    await toggleHidden(tabs, 7);
    expect(setHiddenSent(tabs)).toEqual([
      { tabId: 7, message: { type: 'setHidden', data: { hidden: next } } },
    ]);
  });

  it('does nothing in a tab without a marker', async () => {
    const tabs = createInMemoryTabs([{ id: 7 }]);
    await toggleHidden(tabs, 7);
    expect(tabs.sent).toEqual([]);
  });

  it('does nothing when the marker answers something that is not a status (REQ-SEC-003)', async () => {
    const tabs = tabAnswering({ hidden: 'yes' });
    await toggleHidden(tabs, 7);
    expect(setHiddenSent(tabs)).toEqual([]);
  });
});
