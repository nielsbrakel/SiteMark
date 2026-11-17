import type { SiteMarkState } from '../model/schema';
import { notImplemented } from '../not-implemented';

/**
 * Is a site group switched off for this URL (REQ-POP-010)? A group with a matching pattern that
 * the URL doesn't exclude, but that is not enabled: the marker doesn't run there, yet the toolbar
 * icon still says SiteMark knows the site.
 */
export function hasOffGroup(_state: SiteMarkState, _url: string): boolean {
  return notImplemented();
}
