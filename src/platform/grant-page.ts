import { browser } from 'wxt/browser';
import { isOriginPattern, type OriginPattern } from '../core/url/origin';

const PARAM = 'origins';

/** The grant page for these origins (D-229): the fallback where a context can't prompt itself. */
export function grantPageUrl(origins: readonly OriginPattern[]): string {
  const query = new URLSearchParams({ [PARAM]: [...new Set(origins)].join(',') });
  return `${browser.runtime.getURL('/grant.html')}?${query}`;
}

/**
 * The origins a grant page link asks for, from its `location.search`. `undefined` unless every
 * entry is a canonical origin pattern: the page never prompts for anything else.
 */
export function grantPageOrigins(search: string): OriginPattern[] | undefined {
  const entries = new URLSearchParams(search).get(PARAM)?.split(',') ?? [];
  if (entries.length === 0 || !entries.every(isOriginPattern)) return undefined;
  return [...new Set(entries)];
}
