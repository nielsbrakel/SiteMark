import { describe, expect, it } from 'vitest';
import { fixedIdGen } from '../testing/test-doubles';
import { emptyState, markThisSiteGroup } from './defaults';
import { presetColor } from './presets';
import { parseSiteGroup, parseState } from './schema';

describe('REQ-SEC-004 the empty state is a valid state', () => {
  it('has no site groups and follows the system theme', () => {
    const state = emptyState();
    expect(state).toEqual({
      schemaVersion: 1,
      revision: 0,
      siteGroups: [],
      settings: { theme: 'system' },
    });
    expect(parseState(state)).toEqual({ ok: true, value: state });
  });
});

describe('REQ-POP-006 "Mark this site" creates a site group for the current host', () => {
  it('names the group after the host and shows it on one blue top-right ribbon', () => {
    expect(markThisSiteGroup({ hostname: 'www.example.com', port: '' }, fixedIdGen())).toEqual({
      id: 'group0000001',
      name: 'www.example.com',
      enabled: true,
      patterns: [{ id: 'pattern00001', kind: 'wildcard', value: '*://www.example.com/*' }],
      excludes: [],
      marks: [
        {
          id: 'mark00000001',
          enabled: true,
          color: '#1f6feb',
          textColor: 'auto',
          target: { kind: 'page' },
          effects: { ribbon: { text: 'www.example.com', corner: 'top-right' } },
        },
      ],
    });
  });

  it('uses the blue preset and adds nothing but the ribbon (D-203)', () => {
    const [mark] = markThisSiteGroup({ hostname: 'example.com', port: '' }, fixedIdGen()).marks;
    expect(mark?.color).toBe(presetColor('blue'));
    expect(Object.keys(mark?.effects ?? {})).toEqual(['ribbon']);
  });

  it.each([
    ['localhost', '3000', '*://localhost:3000/*'],
    ['[::1]', '8443', '*://[::1]:8443/*'],
    ['192.168.1.20', '', '*://192.168.1.20/*'],
    ['xn--bcher-kva.de', '', '*://xn--bcher-kva.de/*'],
  ])('%s port %j → %s, named after the host only', (hostname, port, value) => {
    const group = markThisSiteGroup({ hostname, port }, fixedIdGen());
    expect(group.patterns.map((pattern) => pattern.value)).toEqual([value]);
    expect(group.name).toBe(hostname);
  });

  it('cuts the ribbon text to 16 characters and the name to 40', () => {
    const hostname = 'staging-eu-west-1.internal.services.example.com';
    const group = markThisSiteGroup({ hostname, port: '' }, fixedIdGen());
    expect(group.name).toBe(hostname.slice(0, 40));
    expect(group.marks[0]?.effects).toEqual({
      ribbon: { text: 'staging-eu-west-', corner: 'top-right' },
    });
    expect(group.patterns[0]?.value).toBe(`*://${hostname}/*`);
  });

  it('is enabled and schema-valid, so it can be stored as is', () => {
    for (const origin of [
      { hostname: 'www.example.com', port: '' },
      { hostname: 'localhost', port: '5173' },
      { hostname: 'a'.repeat(63), port: '65535' },
    ]) {
      const group = markThisSiteGroup(origin, fixedIdGen());
      expect(group.enabled).toBe(true);
      expect(parseSiteGroup(group)).toEqual({ ok: true, value: group });
    }
  });
});
