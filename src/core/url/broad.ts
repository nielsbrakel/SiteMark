import { notImplemented } from '../not-implemented';

/**
 * Is `domain` (normalized ASCII) a public suffix: any single-label TLD, or a common multi-part
 * suffix from the built-in list (REQ-URL-009, D-212)? `localhost` is not one.
 */
export function isPublicSuffix(_domain: string): boolean {
  return notImplemented();
}
