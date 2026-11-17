import { describe, expect, it } from 'vitest';
import { emptyState } from '../../core/model/defaults';
import { aSiteGroup, aState, aWildcardPattern } from '../../core/testing/builders';
import type { LoadedState } from '../ports';
import { createInMemoryBadge } from '../testing/in-memory-badge';
import { createInMemoryStateRepo } from '../testing/in-memory-state-repo';
import { createInMemoryTabs } from '../testing/in-memory-tabs';
import { showOffStickers } from './off-stickers';

const PROD = [aWildcardPattern({ value: '*://prod.example.com/*' })];
const STAGING = [aWildcardPattern({ value: '*://staging.example.com/*' })];

function setup(loaded: LoadedState) {
  const badge = createInMemoryBadge();
  const tabs = createInMemoryTabs([
    { id: 1, url: 'https://prod.example.com/' },
    { id: 2, url: 'https://staging.example.com/' },
    { id: 3, url: 'https://elsewhere.example.com/' },
    { id: 4 },
  ]);
  const stateRepo = createInMemoryStateRepo({ loaded });
  return { badge, deps: { badge, tabs, stateRepo } };
}

const normal = (...groups: Parameters<typeof aSiteGroup>[0][]): LoadedState => ({
  mode: 'normal',
  state: aState({ siteGroups: groups.map((group) => aSiteGroup(group)) }),
});

describe('REQ-POP-010 tabs of a site whose groups are all off get the grey sticker', () => {
  it('greys the tabs of an off group and clears the tabs no group matches', async () => {
    const { badge, deps } = setup(normal({ patterns: PROD, enabled: false }));
    await badge.setState(3, 'active');
    await showOffStickers(deps);
    expect([1, 2, 3].map((id) => badge.stateOf(id))).toEqual(['hidden', 'none', 'none']);
  });

  it('leaves a tab with an active group to its marker', async () => {
    const { badge, deps } = setup(
      normal({ patterns: PROD, enabled: true }, { patterns: STAGING, enabled: false }),
    );
    await badge.setState(1, 'attention');
    await showOffStickers(deps);
    expect([1, 2].map((id) => badge.stateOf(id))).toEqual(['attention', 'hidden']);
  });

  it('skips tabs whose URL it may not see', async () => {
    const { badge, deps } = setup(normal({ patterns: PROD, enabled: false }));
    await badge.setState(4, 'attention');
    await showOffStickers(deps);
    expect(badge.stateOf(4)).toBe('attention');
  });

  it('does nothing while the data is read-only (REQ-DATA-007)', async () => {
    const { badge, deps } = setup({ mode: 'readOnly', state: emptyState(), schemaVersion: 2 });
    await badge.setState(1, 'attention');
    await showOffStickers(deps);
    expect(badge.stateOf(1)).toBe('attention');
  });
});
