import { describe, expect, it } from 'vitest';
import { aSiteGroup, aState, aWildcardPattern } from '../testing/builders';
import { hasOffGroup } from './off-groups';

const PROD = [aWildcardPattern({ value: '*://prod.example.com/*' })];
const URL = 'https://prod.example.com/orders';
const stateOf = (...groups: Parameters<typeof aSiteGroup>[0][]) =>
  aState({ siteGroups: groups.map((group) => aSiteGroup(group)) });

describe('REQ-POP-010 a site group that is off still shows on the toolbar icon', () => {
  it('finds a disabled group with a matching pattern', () => {
    expect(hasOffGroup(stateOf({ patterns: PROD, enabled: false }), URL)).toBe(true);
  });

  it('ignores enabled groups, other sites and groups the URL excludes', () => {
    expect(hasOffGroup(stateOf({ patterns: PROD, enabled: true }), URL)).toBe(false);
    expect(
      hasOffGroup(stateOf({ patterns: PROD, enabled: false }), 'https://other.example.com/'),
    ).toBe(false);
    const excluded = {
      patterns: PROD,
      enabled: false,
      excludes: [aWildcardPattern({ value: '*://prod.example.com/orders*' })],
    };
    expect(hasOffGroup(stateOf(excluded), URL)).toBe(false);
  });

  it('finds it next to an enabled group, and ignores a URL it cannot parse', () => {
    const state = stateOf({ patterns: PROD, enabled: true }, { patterns: PROD, enabled: false });
    expect(hasOffGroup(state, URL)).toBe(true);
    expect(hasOffGroup(state, 'not a url')).toBe(false);
  });
});
