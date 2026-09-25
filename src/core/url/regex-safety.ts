import type { RegexErrorCode } from '../errors';
import { notImplemented } from '../not-implemented';
import type { Result } from '../result';

/**
 * Validates a regex source against the safe subset (REQ-URL-004, D-211): ≤ 500 characters, parses
 * with the fixed flags, no backreferences, no lookaround, no nested quantifiers (star height ≤ 1).
 * Returns the source unchanged when it is safe.
 */
export function validateRegex(_source: string): Result<string, RegexErrorCode> {
  return notImplemented();
}
