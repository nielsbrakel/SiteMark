import type { UrlPatternErrorCode } from '../errors';
import { notImplemented } from '../not-implemented';
import type { Result } from '../result';

/** `*` means http or https (REQ-URL-001). */
export type WildcardScheme = 'http' | 'https' | '*';

/** A validated wildcard pattern (REQ-URL-001, REQ-URL-002). */
export type ParsedWildcard = {
  readonly scheme: WildcardScheme;
  /** Lowercase ASCII (punycode), no trailing dot; IPv6 in brackets, in canonical form. */
  readonly host: string;
  /** `*.` + host: the host itself and all its subdomains. */
  readonly includeSubdomains: boolean;
  /** `undefined` matches any port. */
  readonly port: number | undefined;
  /** A glob (`*` = any run of characters) starting with `/`; includes `?query` when `matchesQuery`. */
  readonly path: string;
  /** The pattern path contains `?`, so path and query are matched together. */
  readonly matchesQuery: boolean;
};

/** Parses and validates a wildcard pattern or its shorthand. Never throws (D-225). */
export function parseWildcard(_input: string): Result<ParsedWildcard, UrlPatternErrorCode> {
  return notImplemented();
}

/** The canonical text of a parsed pattern: `scheme://[*.]host[:port]/path`. */
export function formatWildcard(_parsed: ParsedWildcard): string {
  return notImplemented();
}

/** Parses `input` and returns its canonical text, the form that is stored. */
export function normalizeWildcard(_input: string): Result<string, UrlPatternErrorCode> {
  return notImplemented();
}
