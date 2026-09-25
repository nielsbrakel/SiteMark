import type { IdGen } from '../ids';
import { notImplemented } from '../not-implemented';
import type { SiteGroup, SiteMarkState } from './schema';

/** The parts of a page URL "Mark this site" needs; a `URL` object fits. */
export type SiteOrigin = {
  /** Lowercase, punycode; IPv6 in brackets (`[::1]`). */
  readonly hostname: string;
  /** `''` for the scheme's default port. */
  readonly port: string;
};

/** The state on first run: no site groups, system theme. */
export function emptyState(): SiteMarkState {
  return notImplemented();
}

/**
 * "Mark this site" (REQ-POP-006, D-201): a group named after the host that matches exactly this host
 * and port on http and https, with one blue page ribbon showing the host (D-203: ribbon only).
 */
export function markThisSiteGroup(_origin: SiteOrigin, _idGen: IdGen): SiteGroup {
  return notImplemented();
}
