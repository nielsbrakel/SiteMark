import { notImplemented } from '../not-implemented';

/**
 * Glob match where `*` is any run of characters (including `/`) and everything else is literal and
 * case-sensitive. Linear and non-backtracking, no RegExp (REQ-URL-010).
 */
export function matchGlob(_pattern: string, _text: string): boolean {
  return notImplemented();
}
