import { describe, expect, it, vi } from 'vitest';
import type { MarkId } from '../../core/ids';
import { emptyState } from '../../core/model/defaults';
import type { TabStatus } from '../../core/render/status';
import { aSiteGroup, aState, aWildcardPattern } from '../../core/testing/builders';
import type { LoadedState } from '../ports';
import { createInMemoryBadge } from '../testing/in-memory-badge';
import { createInMemoryStateRepo } from '../testing/in-memory-state-repo';
import { createInMemoryTabs } from '../testing/in-memory-tabs';
import { reportStatus, showReadOnlyBadges, toolbarState } from './report-status';

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

const tab = (tabId: number) => ({ tabId, url: 'https://prod.example.com/' });
const idle = status({ marks: [], favicon: 'off', active: false });
const missing = status({ marks: [{ markId: OUTLINE, found: false }] });

describe('REQ-POP-010 REQ-POP-007 the toolbar sticker follows the tab status (D-219, D-303)', () => {
  it.each([
    ['no active group', idle, 'none'],
    ['an active group that renders fully', status(), 'active'],
    ['an active group without marks or favicon', status({ marks: [], favicon: 'off' }), 'active'],
    ['"Hide on this tab"', status({ hidden: true }), 'hidden'],
    ['a missing element', missing, 'attention'],
    ['a favicon that cannot be tinted', status({ favicon: 'unavailable' }), 'attention'],
    ['a missing element while hidden', { ...missing, hidden: true }, 'attention'],
  ] as const)('is %s: %s', (_, tabStatus, expected) => {
    expect(toolbarState(tabStatus, false)).toBe(expected);
  });

  it('is "attention" while the data is read-only (REQ-DATA-007)', () => {
    expect(toolbarState(status(), true)).toBe('attention');
    expect(toolbarState(idle, true)).toBe('attention');
  });

  it('sets the sticker of the reporting tab only', async () => {
    const { badge, deps } = setup();
    await reportStatus(deps, tab(7), status());
    await reportStatus(deps, tab(8), missing);
    expect([badge.stateOf(7), badge.stateOf(8), badge.stateOf(9)]).toEqual([
      'active',
      'attention',
      'none',
    ]);
  });

  it('follows the tab as it is hidden, resolved and emptied', async () => {
    const { badge, deps } = setup();
    await reportStatus(deps, tab(7), missing);
    await reportStatus(deps, tab(7), status());
    expect(badge.stateOf(7)).toBe('active');
    await reportStatus(deps, tab(7), status({ hidden: true }));
    expect(badge.stateOf(7)).toBe('hidden');
    await reportStatus(deps, tab(7), idle);
    expect(badge.stateOf(7)).toBe('none');
  });

  it('shows "attention" on every reporting tab while the data is read-only (REQ-DATA-007)', async () => {
    const { badge, deps } = setup(readOnly);
    await reportStatus(deps, tab(7), status());
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

describe('REQ-POP-010 a marker that reports nothing active still shows an off group', () => {
  const PROD = [aWildcardPattern({ value: '*://prod.example.com/*' })];
  const off = (enabled: boolean): LoadedState => ({
    mode: 'normal',
    state: aState({ siteGroups: [aSiteGroup({ patterns: PROD, enabled })] }),
  });

  it('shows "hidden" when a matching group is off', async () => {
    const { badge, deps } = setup(off(false));
    await reportStatus(deps, tab(7), idle);
    expect(badge.stateOf(7)).toBe('hidden');
  });

  it('shows the plain icon when no group matches the site, or the matching group is on', async () => {
    const { badge, deps } = setup(off(true));
    await reportStatus(deps, tab(7), idle);
    await reportStatus(deps, { tabId: 8, url: 'https://other.example.com/' }, idle);
    expect([badge.stateOf(7), badge.stateOf(8)]).toEqual(['none', 'none']);
  });

  it('keeps "active" while another group on the site is off', async () => {
    const { badge, deps } = setup(off(false));
    await reportStatus(deps, tab(7), status());
    expect(badge.stateOf(7)).toBe('active');
  });
});
