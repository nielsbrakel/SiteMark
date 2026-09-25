import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { aRegexPattern, aSiteGroup, aState, aWildcardPattern } from '../testing/builders';
import { messagesOf, okValue, pathsOf, times, untrusted } from '../testing/schema-results';
import { parseHex, parseSiteGroup, parseState, parseUrlPattern } from './schema';

describe('REQ-SEC-004 strict state schema with readable issue paths', () => {
  it('accepts what the builders produce', () => {
    const state = aState({
      siteGroups: [aSiteGroup(), aSiteGroup({ patterns: [aRegexPattern()], excludes: [] })],
    });
    expect(okValue(parseState(untrusted(state)))).toEqual(state);
  });

  it('parses with zod in jitless mode, so no code is generated at runtime (D-238)', () => {
    okValue(parseState(aState()));
    expect(z.config().jitless).toBe(true);
  });

  it.each([
    ['the state', (s: Record<string, unknown>) => Object.assign(s, { extra: 1 }), ''],
    [
      'the settings',
      (s: Record<string, unknown>) => Object.assign(s, { settings: { theme: 'dark', extra: 1 } }),
      'settings',
    ],
    [
      'a site group',
      (s: Record<string, unknown>) =>
        Object.assign(s, { siteGroups: [{ ...aSiteGroup(), extra: 1 }] }),
      'siteGroups[0]',
    ],
    [
      'a pattern',
      (s: Record<string, unknown>) =>
        Object.assign(s, {
          siteGroups: [{ ...aSiteGroup(), patterns: [{ ...aWildcardPattern(), extra: 1 }] }],
        }),
      'siteGroups[0].patterns[0]',
    ],
  ])('rejects unknown keys on %s', (_where, mutate, path) => {
    const result = parseState(mutate(untrusted(aState()) as Record<string, unknown>));
    expect(pathsOf(result)).toEqual([path]);
    expect(messagesOf(result).join()).toContain('extra');
  });

  it('rejects a __proto__ key instead of merging it into a prototype', () => {
    const json = JSON.stringify(aState()).replace('{', '{"__proto__":{"polluted":true},');
    const result = parseState(JSON.parse(json));
    expect(result.ok).toBe(false);
    expect(messagesOf(result).join()).toContain('__proto__');
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it.each([
    ['schemaVersion', 2],
    ['schemaVersion', '1'],
    ['revision', -1],
    ['revision', 1.5],
    ['revision', '3'],
    ['siteGroups', {}],
    ['settings', { theme: 'blue' }],
  ])('rejects %s = %j', (key, value) => {
    const state = { ...(untrusted(aState()) as object), [key]: value };
    expect(pathsOf(parseState(state))[0]).toMatch(new RegExp(`^${key}`));
  });

  it.each(['system', 'light', 'dark'])('accepts theme %s', (theme) => {
    const state = { ...(untrusted(aState()) as object), settings: { theme } };
    expect(okValue(parseState(state)).settings.theme).toBe(theme);
  });

  it('rejects missing fields', () => {
    const { revision: _, ...rest } = aState();
    expect(pathsOf(parseState(rest))).toEqual(['revision']);
    expect(parseState(null).ok).toBe(false);
    expect(parseState([]).ok).toBe(false);
  });

  it.each(['', 'short', 'abcdefghijk+', 'abcdefghijklm', 12])('rejects the ID %j', (id) => {
    const state = aState({ siteGroups: [aSiteGroup(), { ...aSiteGroup(), id } as never] });
    expect(pathsOf(parseState(state))).toEqual(['siteGroups[1].id']);
  });

  it('rejects an ID that is used twice', () => {
    const group = aSiteGroup();
    const copy = aSiteGroup({ id: group.id });
    expect(pathsOf(parseState(aState({ siteGroups: [group, copy] })))).toEqual([
      'siteGroups[1].id',
    ]);
    const pattern = aWildcardPattern();
    const twice = aSiteGroup({ patterns: [pattern], excludes: [pattern] });
    expect(pathsOf(parseState(aState({ siteGroups: [twice] })))).toEqual([
      'siteGroups[0].excludes[0].id',
    ]);
  });

  it('reports every issue with a readable path', () => {
    const bad = aSiteGroup({ patterns: [aWildcardPattern(), aWildcardPattern({ value: '' })] });
    const state = aState({ siteGroups: [aSiteGroup(), bad, { ...aSiteGroup(), name: '' }] });
    expect(pathsOf(parseState(state))).toEqual([
      'siteGroups[1].patterns[1].value',
      'siteGroups[2].name',
    ]);
    expect(messagesOf(parseState(state)).every((message) => message.length > 0)).toBe(true);
  });
});

describe('REQ-SEC-004 user text is cleaned of control, format and bidi characters', () => {
  it.each([
    ['  Production  ', 'Production'],
    ['Pro\u0000duc\u0007tion', 'Production'],
    ['\u202EProduction\u202C', 'Production'],
    ['Pro\u2066duc\u2069tion\u200E', 'Production'],
    ['Prod\u200Buction\uFEFF', 'Production'],
    ['Prod\nuction\t', 'Production'],
    ['Pro\u2028duction', 'Production'],
    ['Productie 🚀', 'Productie 🚀'],
  ])('%j → %j', (name, expected) => {
    expect(okValue(parseSiteGroup(aSiteGroup({ name }))).name).toBe(expected);
  });

  it.each(['', '   ', '\u202E\u200B\u0000'])('rejects the empty name %j', (name) => {
    expect(pathsOf(parseSiteGroup(aSiteGroup({ name })))).toEqual(['name']);
  });

  it('allows 40 characters after cleaning, not 41', () => {
    const forty = 'x'.repeat(40);
    expect(okValue(parseSiteGroup(aSiteGroup({ name: `\u202E${forty} ` }))).name).toBe(forty);
    expect(pathsOf(parseSiteGroup(aSiteGroup({ name: `${forty}y` })))).toEqual(['name']);
  });
});

describe('REQ-SEC-004 hex colors', () => {
  it.each([
    ['#1f6feb', '#1f6feb'],
    ['#ABCDEF', '#abcdef'],
    ['#C93a2E', '#c93a2e'],
  ])('accepts %s as %s', (input, expected) => {
    expect(okValue(parseHex(input))).toBe(expected);
  });

  it.each(['#abc', 'abcdef', '#abcdeg', '#abcdef0', ' #abcdef', 'red', 0xabcdef, null])(
    'rejects %j',
    (input) => {
      expect(parseHex(input).ok).toBe(false);
    },
  );
});

describe('REQ-SEC-004 URL pattern shape and limits', () => {
  it('accepts both builder patterns', () => {
    const wildcard = aWildcardPattern();
    const regex = aRegexPattern();
    expect(okValue(parseUrlPattern(untrusted(wildcard)))).toEqual(wildcard);
    expect(okValue(parseUrlPattern(untrusted(regex)))).toEqual(regex);
  });

  it('allows a wildcard of 1..500 characters', () => {
    const long = `https://example.com/${'a'.repeat(480)}`;
    expect(parseUrlPattern(aWildcardPattern({ value: long })).ok).toBe(true);
    expect(pathsOf(parseUrlPattern(aWildcardPattern({ value: `${long}a` })))).toEqual(['value']);
    expect(pathsOf(parseUrlPattern(aWildcardPattern({ value: '' })))).toEqual(['value']);
  });

  it('allows at most 10 stars in a wildcard', () => {
    const value = (stars: number) => `https://*.example.com/${'*/'.repeat(stars - 1)}`;
    expect(parseUrlPattern(aWildcardPattern({ value: value(10) })).ok).toBe(true);
    expect(pathsOf(parseUrlPattern(aWildcardPattern({ value: value(11) })))).toEqual(['value']);
  });

  it('allows a regex of 1..500 characters', () => {
    expect(parseUrlPattern(aRegexPattern({ value: 'a'.repeat(500) })).ok).toBe(true);
    expect(pathsOf(parseUrlPattern(aRegexPattern({ value: 'a'.repeat(501) })))).toEqual(['value']);
    expect(pathsOf(parseUrlPattern(aRegexPattern({ value: '' })))).toEqual(['value']);
  });

  it('needs 1..20 origins on a regex', () => {
    const origins = times(21, () => 'https://example.com/*');
    expect(parseUrlPattern(untrusted(aRegexPattern({ origins: [] }))).ok).toBe(false);
    expect(parseUrlPattern({ ...aRegexPattern(), origins: origins.slice(0, 20) }).ok).toBe(true);
    expect(pathsOf(parseUrlPattern({ ...aRegexPattern(), origins }))).toEqual(['origins']);
  });

  it.each([
    'https://example.com/*',
    'http://example.com/*',
    '*://*.example.com/*',
    'http://localhost/*',
    'https://[::1]/*',
    'https://192.168.0.1/*',
  ])('accepts the origin %s', (origin) => {
    expect(parseUrlPattern({ ...aRegexPattern(), origins: [origin] }).ok).toBe(true);
  });

  it.each([
    'https://example.com',
    'https://example.com/',
    'https://example.com/admin/*',
    'ftp://example.com/*',
    'example.com/*',
    '*://*/*',
    'https://ex*ample.com/*',
    'https://example.com:port/*',
    '',
    // Only the canonical form the URL engine produces (REQ-URL-005): no port, never broad.
    'http://localhost:3000/*',
    'https://[::1]:8443/*',
    'https://*.co.uk/*',
    '*://*.com/*',
  ])('rejects the origin %j', (origin) => {
    const result = parseUrlPattern({ ...aRegexPattern(), origins: ['https://ok.com/*', origin] });
    expect(pathsOf(result)).toEqual(['origins[1]']);
  });

  it.each([
    ['an unknown kind', () => ({ ...aWildcardPattern(), kind: 'glob' })],
    ['origins on a wildcard', () => ({ ...aWildcardPattern(), origins: ['https://a.com/*'] })],
    ['no value', () => ({ id: aWildcardPattern().id, kind: 'wildcard' })],
    ['a bad ID', () => ({ ...aRegexPattern(), id: 'nope' })],
  ])('rejects a pattern with %s', (_what, pattern) => {
    expect(parseUrlPattern(pattern()).ok).toBe(false);
  });
});

describe('REQ-GRP-002 site group limits and the enabled invariant', () => {
  it('allows 50 patterns and 50 excludes, not 51', () => {
    const fifty = () => times(50, () => aWildcardPattern());
    expect(parseSiteGroup(aSiteGroup({ patterns: fifty(), excludes: fifty() })).ok).toBe(true);
    const tooMany = [...fifty(), aWildcardPattern()];
    expect(pathsOf(parseSiteGroup(aSiteGroup({ patterns: tooMany })))).toEqual(['patterns']);
    expect(pathsOf(parseSiteGroup(aSiteGroup({ excludes: tooMany })))).toEqual(['excludes']);
  });

  it('allows 200 site groups, not 201', () => {
    const groups = times(200, () => aSiteGroup());
    expect(parseState(aState({ siteGroups: groups })).ok).toBe(true);
    const tooMany = [...groups, aSiteGroup()];
    expect(pathsOf(parseState(aState({ siteGroups: tooMany })))).toEqual(['siteGroups']);
  });

  it('needs at least one pattern to be enabled', () => {
    const enabled = aSiteGroup({ enabled: true, patterns: [], excludes: [aWildcardPattern()] });
    expect(pathsOf(parseSiteGroup(enabled))).toEqual(['enabled']);
    const disabled = aSiteGroup({ enabled: false, patterns: [] });
    expect(okValue(parseSiteGroup(disabled))).toEqual(disabled);
  });
});
