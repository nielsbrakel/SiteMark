import { describe, expect, it, vi } from 'vitest';
import type { MarkId } from '../../core/ids';
import { emptyState } from '../../core/model/defaults';
import type { TabStatus } from '../../core/render/status';
import type { LoadedState } from '../ports';
import { createInMemoryBadge } from '../testing/in-memory-badge';
import { createInMemoryStateRepo } from '../testing/in-memory-state-repo';
import { createInMemoryTabs } from '../testing/in-memory-tabs';
import { reportStatus, showReadOnlyBadges } from './report-status';

const OUTLINE = 'mark-outline' as MarkId;
const RIBBON = 'mark-ribbon1' as MarkId;

const readOnly: LoadedState = { mode: 'readOnly', state: emptyState(), schemaVersion: 2 };

function setup(loaded?: LoadedState) {
  const badge = createInMemoryBadge();
  const stateRepo = createInMemoryStateRepo(loaded ? { loaded } : {});
  return { badge, deps: { badge, stateRepo } };
}

const status = (overrides: Partial<TabStatus> = {}): TabStatus => ({
  marks: [
    { markId: OUTLINE, found: true },
    { markId: RIBBON, found: true },
  ],
  favicon: 'available',
  hidden: false,
  active: true,
  ...overrides,
});

describe('REQ-POP-007 a toolbar badge "!" where an active site group cannot fully render (D-219)', () => {
  it('shows no badge when everything renders', async () => {
    const { badge, deps } = setup();
    const setState = vi.spyOn(badge, 'setState');
    await reportStatus(deps, 7, status());
    await reportStatus(deps, 8, status({ marks: [], favicon: 'off' }));
    expect(setState.mock.calls).toEqual([
      [7, 'none'],
      [8, 'none'],
    ]);
  });

  it('shows "attention" when an element is missing', async () => {
    const { badge, deps } = setup();
    await reportStatus(deps, 7, status({ marks: [{ markId: OUTLINE, found: false }] }));
    expect(badge.stateOf(7)).toBe('attention');
  });

  it('shows "attention" when the favicon cannot be tinted', async () => {
    const { badge, deps } = setup();
    await reportStatus(deps, 7, status({ favicon: 'unavailable' }));
    expect(badge.stateOf(7)).toBe('attention');
  });

  it('clears the badge once the problem is resolved', async () => {
    const { badge, deps } = setup();
    await reportStatus(deps, 7, status({ marks: [{ markId: OUTLINE, found: false }] }));
    await reportStatus(deps, 7, status());
    expect(badge.stateOf(7)).toBe('none');
  });

  it('keeps a badge per tab', async () => {
    const { badge, deps } = setup();
    await reportStatus(deps, 7, status({ favicon: 'unavailable' }));
    await reportStatus(deps, 8, status());
    expect([badge.stateOf(7), badge.stateOf(8)]).toEqual(['attention', 'none']);
  });

  it('shows "attention" on every reporting tab while the data is read-only (REQ-DATA-007)', async () => {
    const { badge, deps } = setup(readOnly);
    await reportStatus(deps, 7, status());
    expect(badge.stateOf(7)).toBe('attention');
  });
});

describe('REQ-POP-007 REQ-DATA-007 read-only data marks every open tab on start', () => {
  const openTabs = [{ id: 1, url: 'https://prod.example.com/' }, { id: 2 }];

  it('shows "attention" on every open tab while the data is read-only', async () => {
    const { badge, deps } = setup(readOnly);
    await showReadOnlyBadges({ ...deps, tabs: createInMemoryTabs(openTabs) });
    expect([badge.stateOf(1), badge.stateOf(2)]).toEqual(['attention', 'attention']);
  });

  it('leaves the badges alone otherwise', async () => {
    const { badge, deps } = setup();
    const setState = vi.spyOn(badge, 'setState');
    await showReadOnlyBadges({ ...deps, tabs: createInMemoryTabs(openTabs) });
    expect(setState).not.toHaveBeenCalled();
  });
});
