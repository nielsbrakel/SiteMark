import { notImplemented } from '../core/not-implemented';
import type { OriginPattern } from '../core/url/origin';

/** The grant page for these origins (D-229): the fallback where a context can't prompt itself. */
export function grantPageUrl(_origins: readonly OriginPattern[]): string {
  return notImplemented();
}

/**
 * The origins a grant page link asks for, from its `location.search`. `undefined` unless every
 * entry is a canonical origin pattern: the page never prompts for anything else.
 */
export function grantPageOrigins(_search: string): OriginPattern[] | undefined {
  return notImplemented();
}
