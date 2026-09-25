// Typed error codes for the whole core (D-225). Each area has its own union; a task that needs a new
// code adds it to its area (or adds an area to `ErrorCode`) and adds `error<Code>` to both locales.
// The type test in errors.test.ts fails until the message exists.

/** Wildcard URL patterns (REQ-URL-001…003, REQ-URL-009, REQ-URL-010). */
export type UrlPatternErrorCode =
  | 'patternEmpty'
  | 'patternTooLong'
  | 'patternTooManyWildcards'
  | 'patternInvalidScheme'
  | 'patternWildcardInHost'
  | 'patternInvalidHost'
  | 'patternInvalidPort'
  | 'patternInvalidIpv6'
  | 'patternTooBroad'
  | 'urlTooLong';

/** Regex patterns and their origins (REQ-URL-004). */
export type RegexErrorCode =
  | 'regexInvalid'
  | 'regexUnsafe'
  | 'regexTooLong'
  | 'regexNeedsOrigin'
  | 'regexTooManyOrigins';

/** Stored state and imports (REQ-DATA-001, REQ-DATA-004, REQ-DATA-007, REQ-SEC-004). */
export type DataErrorCode =
  | 'importInvalidJson'
  | 'importTooDeep'
  | 'importTooLarge'
  | 'importSchemaInvalid'
  | 'importPatternInvalid'
  | 'importUnsupportedVersion'
  | 'stateReadOnly'
  | 'stateUnreadable';

/** Site group names, invariants, limits and contents (REQ-GRP-001, REQ-GRP-002, REQ-MARK-001). */
export type SiteGroupErrorCode =
  | 'siteGroupNeedsPattern'
  | 'siteGroupNameInvalid'
  | 'siteGroupLimitReached'
  | 'patternLimitReached'
  | 'excludeLimitReached'
  | 'markLimitReached'
  | 'markInvalid'
  | 'siteGroupNotFound'
  | 'patternNotFound'
  | 'markNotFound';

export type ErrorCode = UrlPatternErrorCode | RegexErrorCode | DataErrorCode | SiteGroupErrorCode;

/** The i18n key of a code's readable message: `patternEmpty` → `errorPatternEmpty`. */
export type ErrorMessageKey<C extends ErrorCode = ErrorCode> = `error${Capitalize<C>}`;

/** Maps a code to its message key (REQ-URL-003). Core can't import src/lib, so the UI translates it. */
export function errorMessageKey<C extends ErrorCode>(code: C): ErrorMessageKey<C> {
  return `error${code.charAt(0).toUpperCase()}${code.slice(1)}` as ErrorMessageKey<C>;
}
