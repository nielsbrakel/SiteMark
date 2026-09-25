import { describe, expect, it } from 'vitest';
import { markThisSiteGroup, type SiteOrigin } from '../model/defaults';
import type { SiteMarkState } from '../model/schema';
import { err } from '../result';
import { aSiteGroup } from '../testing/builders';
import { applied, stateWith } from '../testing/reducers';
import { times } from '../testing/schema-results';
import { fixedIdGen } from '../testing/test-doubles';
import { markThisSite } from './mark-this-site';

const mark = (state: SiteMarkState, origin: SiteOrigin, idGen = fixedIdGen()) =>
  markThisSite(state, { type: 'markThisSite', origin }, { idGen });

describe('REQ-POP-006 Mark this site adds a site group for the origin', () => {
  it.each([
    [{ hostname: 'prod.example.com', port: '' }],
    [{ hostname: 'localhost', port: '3000' }],
    [{ hostname: '[::1]', port: '8080' }],
    [{ hostname: 'xn--bcher-kva.de', port: '' }],
  ])('appends the "Mark this site" group for %j at the bottom', (origin) => {
    const existing = aSiteGroup();
    const next = applied(mark(stateWith(existing), origin));
    expect(next.siteGroups).toEqual([existing, markThisSiteGroup(origin, fixedIdGen())]);
  });

  it('adds another group each time, even for an origin that already has one', () => {
    const origin = { hostname: 'prod.example.com', port: '' };
    const idGen = fixedIdGen();
    const twice = applied(mark(applied(mark(stateWith(), origin, idGen)), origin, idGen));
    expect(twice.siteGroups.map((group) => group.id)).toEqual(['group0000001', 'group0000002']);
    expect(twice.siteGroups[1]?.patterns[0]?.value).toBe('*://prod.example.com/*');
  });

  it.each([
    [{ hostname: 'Prod.Example.com', port: '' }, 'patternInvalidHost'],
    [{ hostname: '*.example.com', port: '' }, 'patternInvalidHost'],
    [{ hostname: 'example.com/admin', port: '' }, 'patternInvalidHost'],
    [{ hostname: '', port: '' }, 'patternInvalidHost'],
    [{ hostname: 'example.com', port: 'abc' }, 'patternInvalidPort'],
  ])('refuses an origin that is not an exact, canonical host: %j', (origin, code) => {
    expect(mark(stateWith(), origin)).toEqual(err(code));
  });

  it('refuses when there are already 200 site groups', () => {
    const full = stateWith(...times(200, () => aSiteGroup()));
    const origin = { hostname: 'example.com', port: '' };
    expect(mark(full, origin)).toEqual(err('siteGroupLimitReached'));
  });
});
