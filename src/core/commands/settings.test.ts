import { describe, expect, it } from 'vitest';
import { emptyState } from '../model/defaults';
import type { Theme } from '../model/schema';
import { aSiteGroup, aState } from '../testing/builders';
import { applied, frozen, stateWith } from '../testing/reducers';
import { resetAll, setTheme } from './settings';

describe('REQ-OPT-004 choose the theme', () => {
  it.each<Theme>(['system', 'light', 'dark'])('sets the theme to %s and nothing else', (theme) => {
    const state = stateWith(aSiteGroup());
    const next = applied(setTheme(state, { type: 'setTheme', theme }));
    expect(next).toEqual({ ...state, settings: { theme } });
  });
});

describe('REQ-OPT-005 reset everything', () => {
  it('deletes every site group and restores the default settings', () => {
    const groups = [aSiteGroup(), aSiteGroup()];
    const state = frozen(aState({ revision: 9, siteGroups: groups, settings: { theme: 'dark' } }));
    const next = applied(resetAll(state, { type: 'resetAll' }));
    expect(next).toEqual({ ...emptyState(), revision: 9 });
  });

  it('works on the empty state', () => {
    expect(applied(resetAll(frozen(emptyState()), { type: 'resetAll' }))).toEqual(emptyState());
  });
});
