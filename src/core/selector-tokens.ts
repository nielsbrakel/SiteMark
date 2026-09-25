import { notImplemented } from './not-implemented';

/**
 * Whether a class name, id or attribute value looks hand-written, so a selector built from it survives
 * the next deploy (REQ-PICK-004). Generated tokens (CSS-in-JS and CSS Modules hashes, long hex or digit
 * runs) are skipped by the selector generator.
 */
export function isStableToken(_token: string): boolean {
  return notImplemented();
}
