import { describe, expect, it } from 'vitest';
import type { SiteGroup } from '../model/schema';
import { aRegexPattern, aSiteGroup, aState, aWildcardPattern } from '../testing/builders';
import { times } from '../testing/schema-results';
import {
  activeGroups,
  firstMatchingPattern,
  isActive,
  isExcluded,
  matchingGroups,
  patternMatches,
} from './group-match';
import { type OriginPattern, parseOriginPattern } from './origin';
import { parseUrl } from './url-parts';

const wildcard = (value: string) => aWildcardPattern({ value });

function origin(input: string): OriginPattern {
  const parsed = parseOriginPattern(input);
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.value;
}

const regex = (value: string, origins: string[]) =>
  aRegexPattern({ value, origins: origins.map(origin) });

const names = (groups: SiteGroup[]) => groups.map((group) => group.name);

const prod = aSiteGroup({
  name: 'Production',
  patterns: [wildcard('https://example.com/*'), wildcard('*.example.com')],
});
const staging = aSiteGroup({
  name: 'Staging',
  patterns: [wildcard('https://staging.example.com/*')],
});
const admin = aSiteGroup({
  name: 'Admin',
  enabled: false,
  patterns: [regex(String.raw`^https://example\.com/admin/`, ['https://example.com'])],
});

describe('REQ-URL-006 patternMatches, isActive and priority order', () => {
  it('patternMatches when any pattern matches, ignoring enabled', () => {
    expect(patternMatches(prod, 'https://a.example.com/x')).toBe(true);
    expect(patternMatches(prod, 'https://other.com/')).toBe(false);
    expect(patternMatches(admin, 'https://example.com/admin/users')).toBe(true);
    expect(patternMatches(aSiteGroup({ enabled: false, patterns: [] }), 'https://a.com/')).toBe(
      false,
    );
  });

  it('isActive only for an enabled group with a matching pattern', () => {
    expect(isActive(prod, 'https://example.com/')).toBe(true);
    expect(isActive(prod, 'https://other.com/')).toBe(false);
    expect(isActive(admin, 'https://example.com/admin/users')).toBe(false);
    expect(isActive({ ...admin, enabled: true }, 'https://example.com/admin/users')).toBe(true);
  });

  it('never matches a URL that does not parse', () => {
    expect(patternMatches(prod, 'not a url')).toBe(false);
    expect(isActive(prod, 'about:blank')).toBe(false);
    expect(activeGroups(aState({ siteGroups: [prod] }), '')).toEqual([]);
  });

  it('accepts a URL that is already split into parts', () => {
    const parts = parseUrl('https://staging.example.com/');
    expect(parts && isActive(staging, parts)).toBe(true);
  });

  it('lists active groups by priority (list order)', () => {
    const state = aState({ siteGroups: [staging, admin, prod] });
    expect(names(activeGroups(state, 'https://staging.example.com/'))).toEqual([
      'Staging',
      'Production',
    ]);
    const reordered = aState({ siteGroups: [prod, admin, staging] });
    expect(names(activeGroups(reordered, 'https://staging.example.com/'))).toEqual([
      'Production',
      'Staging',
    ]);
    expect(activeGroups(state, 'https://other.com/')).toEqual([]);
  });

  it('matchingGroups also lists disabled groups (the popup), by priority', () => {
    const state = aState({ siteGroups: [admin, staging, prod] });
    expect(names(matchingGroups(state, 'https://example.com/admin/x'))).toEqual([
      'Admin',
      'Production',
    ]);
    expect(names(activeGroups(state, 'https://example.com/admin/x'))).toEqual(['Production']);
  });

  it('firstMatchingPattern names the pattern that matched (for the live tester)', () => {
    const patterns = prod.patterns;
    expect(firstMatchingPattern(patterns, 'https://example.com/')).toBe(patterns[0]);
    expect(firstMatchingPattern(patterns, 'https://a.example.com/')).toBe(patterns[1]);
    expect(firstMatchingPattern(patterns, 'https://other.com/')).toBeUndefined();
    expect(firstMatchingPattern([], 'https://example.com/')).toBeUndefined();
  });
});

describe('REQ-URL-008 exclude patterns suppress a match', () => {
  const withExcludes = aSiteGroup({
    name: 'Production',
    patterns: [wildcard('*.example.com')],
    excludes: [wildcard('https://example.com/status*'), regex('/health$', ['*://*.example.com'])],
  });

  it('an excluded URL is not active, but the group still pattern-matches', () => {
    expect(isActive(withExcludes, 'https://example.com/')).toBe(true);
    expect(isExcluded(withExcludes, 'https://example.com/status/db')).toBe(true);
    expect(isActive(withExcludes, 'https://example.com/status/db')).toBe(false);
    expect(isActive(withExcludes, 'https://api.example.com/health')).toBe(false);
    expect(isExcluded(withExcludes, 'https://api.example.com/healthy')).toBe(false);
    expect(patternMatches(withExcludes, 'https://example.com/status')).toBe(true);
  });

  it('an excluded group drops out of activeGroups, the others still apply', () => {
    const state = aState({ siteGroups: [withExcludes, prod] });
    expect(names(activeGroups(state, 'https://example.com/status'))).toEqual(['Production']);
    expect(activeGroups(state, 'https://example.com/status')[0]).toBe(prod);
    expect(matchingGroups(state, 'https://example.com/status')).toHaveLength(2);
  });

  it('excludes alone never make a group match', () => {
    const onlyExcludes = aSiteGroup({
      patterns: [],
      enabled: false,
      excludes: [wildcard('*.a.com')],
    });
    expect(patternMatches(onlyExcludes, 'https://a.com/')).toBe(false);
    expect(isExcluded(aSiteGroup(), 'https://a.com/')).toBe(false);
  });
});

describe('REQ-URL-006 REQ-NFR-003 matching 500 patterns takes < 1 ms per URL', () => {
  it('10 groups × 50 patterns (wildcards and regexes)', () => {
    const groups = times(10, () => null).map((_, g) =>
      aSiteGroup({
        name: `Group ${g}`,
        patterns: times(50, () => null).map((_, p) =>
          p % 5 === 0
            ? regex(String.raw`^https://r${g}-${p}\.example\.com/[a-z]+/\d+$`, [
                `https://r${g}-${p}.example.com`,
              ])
            : wildcard(`https://*.site${g}-${p}.example/admin/*/edit?*`),
        ),
        excludes: [wildcard(`https://site${g}.example/status*`)],
      }),
    );
    const state = aState({ siteGroups: groups });
    const urls = [
      'https://a.b.site9-49.example/admin/x/y/edit?z=1',
      'https://r9-45.example.com/users/42',
      `https://nomatch.example.org/${'a'.repeat(500)}?q=${'b'.repeat(500)}`,
      'https://www.example.com/',
    ];
    expect(names(activeGroups(state, urls[0] ?? ''))).toEqual(['Group 9']);
    const runs = 250;
    const started = Date.now();
    for (let i = 0; i < runs; i++) for (const url of urls) activeGroups(state, url);
    expect((Date.now() - started) / (runs * urls.length)).toBeLessThan(1);
  });
});
