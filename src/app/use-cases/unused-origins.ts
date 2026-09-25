import type { SiteMarkState } from '../../core/model/schema';
import { notImplemented } from '../../core/not-implemented';

/**
 * Granted origins that no pattern of any site group needs any more: what the revoke prompt offers
 * (REQ-PRIV-004).
 */
export function unusedOrigins(_state: SiteMarkState, _granted: readonly string[]): string[] {
  return notImplemented();
}
