import { describe, expect, it } from 'vitest';
import type { Theme } from '../model/schema';
import { aSiteGroup } from '../testing/builders';
import { applied, stateWith } from '../testing/reducers';
import { setTheme } from './settings';

describe('REQ-OPT-004 choose the theme', () => {
  it.each<Theme>(['system', 'light', 'dark'])('sets the theme to %s and nothing else', (theme) => {
    const state = stateWith(aSiteGroup());
    const next = applied(setTheme(state, { type: 'setTheme', theme }));
    expect(next).toEqual({ ...state, settings: { theme } });
  });
});
