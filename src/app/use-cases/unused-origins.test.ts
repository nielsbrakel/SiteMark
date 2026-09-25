import { describe, expect, it } from 'vitest';
import type { SiteGroup } from '../../core/model/schema';
import { aRegexPattern, aSiteGroup, aState, aWildcardPattern } from '../../core/testing/builders';
import type { OriginPattern } from '../../core/url/origin';
import { unusedOrigins } from './unused-origins';

const withPatterns = (...patterns: SiteGroup['patterns']) =>
  aState({ siteGroups: [aSiteGroup({ patterns })] });

const wildcard = (value: string) => aWildcardPattern({ value });

describe('REQ-PRIV-004 offer to revoke the origins no remaining pattern uses', () => {
  it('offers granted origins that no pattern needs, in grant order', () => {
    const state = withPatterns(wildcard('https://prod.example.com/*'));
    const granted = ['*://old.example.com/*', 'https://prod.example.com/*', 'https://gone.test/*'];
    expect(unusedOrigins(state, granted)).toEqual(['*://old.example.com/*', 'https://gone.test/*']);
  });

  it('offers every origin when no site group is left', () => {
    const granted = ['https://prod.example.com/*'];
    expect(unusedOrigins(aState({ siteGroups: [] }), granted)).toEqual(granted);
  });

  it('keeps the explicit origins of regex patterns', () => {
    const origins = ['https://admin.example.com/*' as OriginPattern];
    const state = withPatterns(aRegexPattern({ origins }));
    expect(unusedOrigins(state, ['https://admin.example.com/*'])).toEqual([]);
  });

  it('keeps origins of disabled site groups, which the user may enable again', () => {
    const group = aSiteGroup({ enabled: false, patterns: [wildcard('*://staging.example.com/*')] });
    expect(unusedOrigins(aState({ siteGroups: [group] }), ['*://staging.example.com/*'])).toEqual(
      [],
    );
  });

  it('does not count exclude patterns, which need no permission', () => {
    const group = aSiteGroup({ excludes: [wildcard('https://docs.example.com/*')] });
    const granted = ['https://docs.example.com/*'];
    expect(unusedOrigins(aState({ siteGroups: [group] }), granted)).toEqual(granted);
  });

  it('keeps a grant that still covers part of a pattern, or is part of one', () => {
    const state = withPatterns(
      wildcard('https://prod.example.com/app/*'),
      wildcard('*://*.staging.test/*'),
    );
    const granted = [
      '*://*.example.com/*',
      'https://eu.staging.test/*',
      'https://staging.test/*',
      'http://prod.example.com/*',
      'https://example.com/*',
    ];
    expect(unusedOrigins(state, granted)).toEqual([
      'http://prod.example.com/*',
      'https://example.com/*',
    ]);
  });

  it('never offers what it cannot read as an origin, and each origin once', () => {
    const granted = ['<all_urls>', 'file:///*', 'https://a.test/*', 'https://a.test/*'];
    expect(unusedOrigins(aState({ siteGroups: [] }), granted)).toEqual(['https://a.test/*']);
  });
});
