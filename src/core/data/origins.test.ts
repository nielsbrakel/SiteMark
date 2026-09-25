import { describe, expect, it } from 'vitest';
import type { SiteGroup } from '../model/schema';
import { aRegexPattern, aSiteGroup, aState, aWildcardPattern } from '../testing/builders';
import type { OriginPattern } from '../url/origin';
import {
  originsOfEnabledSiteGroups,
  originsOfSiteGroup,
  originsOfState,
  originsToRequest,
} from './origins';

const origins = (...values: string[]) => values as OriginPattern[];

const onHosts = (...values: string[]): SiteGroup =>
  aSiteGroup({ patterns: values.map((value) => aWildcardPattern({ value })) });

describe('REQ-DATA-005 the origins a site group needs', () => {
  it('derives one origin per wildcard pattern and takes the origins of regex patterns', () => {
    const group = aSiteGroup({
      patterns: [
        aWildcardPattern({ value: 'https://prod.example.com:8443/admin/*' }),
        aWildcardPattern({ value: '*://*.example.org/*' }),
        aRegexPattern({ origins: origins('https://a.test/*', 'http://b.test/*') }),
      ],
    });
    expect(originsOfSiteGroup(group)).toEqual([
      '*://*.example.org/*',
      'http://b.test/*',
      'https://a.test/*',
      'https://prod.example.com/*',
    ]);
  });

  it('lists each origin once and ignores excludes', () => {
    const group = aSiteGroup({
      patterns: [
        aWildcardPattern({ value: 'https://example.com/a/*' }),
        aWildcardPattern({ value: 'https://example.com/b/*' }),
        aRegexPattern({ origins: origins('https://example.com/*') }),
      ],
      excludes: [aWildcardPattern({ value: 'https://docs.example.com/*' })],
    });
    expect(originsOfSiteGroup(group)).toEqual(['https://example.com/*']);
  });

  it('needs no origins without patterns', () => {
    expect(originsOfSiteGroup(aSiteGroup({ enabled: false, patterns: [] }))).toEqual([]);
  });
});

describe('REQ-DATA-005 the origins of a state', () => {
  const state = aState({
    siteGroups: [
      onHosts('https://b.test/*'),
      { ...onHosts('https://a.test/*', 'https://b.test/x/*'), enabled: false },
      onHosts('https://c.test/*'),
    ],
  });

  it('includes every site group, enabled or not, deduplicated and sorted', () => {
    expect(originsOfState(state)).toEqual([
      'https://a.test/*',
      'https://b.test/*',
      'https://c.test/*',
    ]);
  });

  it('can be limited to the enabled site groups (what the marker is registered for)', () => {
    expect(originsOfEnabledSiteGroups(state)).toEqual(['https://b.test/*', 'https://c.test/*']);
  });
});

describe('REQ-DATA-005 originsToRequest: one batched grant after an import', () => {
  const before = aState({ siteGroups: [onHosts('https://a.test/*', 'https://b.test/*')] });

  it('lists every origin the new state needs that the old one did not, once and sorted', () => {
    const after = aState({
      siteGroups: [
        ...before.siteGroups,
        onHosts('https://d.test/*', 'https://c.test/*'),
        aSiteGroup({ patterns: [aRegexPattern({ origins: origins('https://d.test/*') })] }),
      ],
    });
    expect(originsToRequest(before, after)).toEqual(['https://c.test/*', 'https://d.test/*']);
  });

  it('does not ask again for origins that another site group already needed', () => {
    const after = aState({
      siteGroups: [onHosts('https://b.test/*'), onHosts('https://a.test/x/*')],
    });
    expect(originsToRequest(before, after)).toEqual([]);
  });

  it('counts new origins of disabled site groups too', () => {
    const after = aState({
      siteGroups: [...before.siteGroups, { ...onHosts('https://e.test/*'), enabled: false }],
    });
    expect(originsToRequest(before, after)).toEqual(['https://e.test/*']);
  });

  it('never lists origins that are no longer needed', () => {
    expect(originsToRequest(before, aState({ siteGroups: [] }))).toEqual([]);
  });
});
