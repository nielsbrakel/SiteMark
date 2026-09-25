import { MULTI_PART_SUFFIXES } from './public-suffixes';

/**
 * Is `domain` (normalized ASCII) a public suffix: any single-label TLD, or a common multi-part
 * suffix from the built-in list (REQ-URL-009, D-212)? `localhost` is not one. Parsing rejects
 * `*.` + a public suffix, a `*` host and `<all_urls>` with `patternTooBroad`.
 */
export function isPublicSuffix(domain: string): boolean {
  if (domain === 'localhost') return false;
  return !domain.includes('.') || MULTI_PART_SUFFIXES.has(domain);
}
