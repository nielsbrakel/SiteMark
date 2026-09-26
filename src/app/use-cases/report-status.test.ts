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
  ...overrides,
});

describe('REQ-POP-007 a toolbar badge "!" where an active site group cannot fully render (D-219)', () => {
  it('shows no badge when everything renders', async () => {
    const { badge, deps } = setup();
    const setText = vi.spyOn(badge, 'setText');
    await reportStatus(deps, 7, status());
    await reportStatus(deps, 8, status({ marks: [], favicon: 'off' }));
    expect(setText.mock.calls).toEqual([
      [7, ''],
      [8, ''],
    ]);
  });

  it('shows "!" when an element is missing', async () => {
    const { badge, deps } = setup();
    await reportStatus(deps, 7, status({ marks: [{ markId: OUTLINE, found: false }] }));
    expect(badge.textOf(7)).toBe('!');
  });

  it('shows "!" when the favicon cannot be tinted', async () => {
    const { badge, deps } = setup();
    await reportStatus(deps, 7, status({ favicon: 'unavailable' }));
    expect(badge.textOf(7)).toBe('!');
  });

  it('clears the badge once the problem is resolved', async () => {
    const { badge, deps } = setup();
    await reportStatus(deps, 7, status({ marks: [{ markId: OUTLINE, found: false }] }));
    await reportStatus(deps, 7, status());
    expect(badge.textOf(7)).toBe('');
  });

  it('keeps a badge per tab', async () => {
    const { badge, deps } = setup();
    await reportStatus(deps, 7, status({ favicon: 'unavailable' }));
    await reportStatus(deps, 8, status());
    expect([badge.textOf(7), badge.textOf(8)]).toEqual(['!', '']);
  });

  it('shows "!" on every reporting tab while the data is read-only (REQ-DATA-007)', async () => {
    const { badge, deps } = setup(readOnly);
    await reportStatus(deps, 7, status());
    expect(badge.textOf(7)).toBe('!');
  });
});

describe('REQ-POP-007 REQ-DATA-007 read-only data marks every open tab on start', () => {
  const openTabs = [{ id: 1, url: 'https://prod.example.com/' }, { id: 2 }];

  it('shows "!" on every open tab while the data is read-only', async () => {
    const { badge, deps } = setup(readOnly);
    await showReadOnlyBadges({ ...deps, tabs: createInMemoryTabs(openTabs) });
    expect([badge.textOf(1), badge.textOf(2)]).toEqual(['!', '!']);
  });

  it('leaves the badges alone otherwise', async () => {
    const { badge, deps } = setup();
    const setText = vi.spyOn(badge, 'setText');
    await showReadOnlyBadges({ ...deps, tabs: createInMemoryTabs(openTabs) });
    expect(setText).not.toHaveBeenCalled();
  });
});
