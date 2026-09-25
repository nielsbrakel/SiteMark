import { describe, expect, expectTypeOf, it } from 'vitest';
import en from '../../public/_locales/en/messages.json';
import nl from '../../public/_locales/nl/messages.json';
import { type ErrorCode, type ErrorMessageKey, errorMessageKey } from './errors';

// Exhaustive on purpose: a new ErrorCode is a type error here until it gets a row.
const everyCode = {
  patternEmpty: true,
  patternTooLong: true,
  patternTooManyWildcards: true,
  patternInvalidScheme: true,
  patternWildcardInHost: true,
  patternInvalidHost: true,
  patternInvalidPort: true,
  patternInvalidIpv6: true,
  patternTooBroad: true,
  urlTooLong: true,
  regexInvalid: true,
  regexUnsafe: true,
  regexTooLong: true,
  regexNeedsOrigin: true,
  regexTooManyOrigins: true,
  importInvalidJson: true,
  importTooDeep: true,
  importTooLarge: true,
  importSchemaInvalid: true,
  importPatternInvalid: true,
  importUnsupportedVersion: true,
  stateReadOnly: true,
  stateUnreadable: true,
  siteGroupNeedsPattern: true,
  siteGroupNameInvalid: true,
  siteGroupLimitReached: true,
  patternLimitReached: true,
  excludeLimitReached: true,
  markLimitReached: true,
  markInvalid: true,
  siteGroupNotFound: true,
  patternNotFound: true,
  markNotFound: true,
  commandProducedInvalidState: true,
} as const satisfies Record<ErrorCode, true>;

const codes = Object.keys(everyCode) as ErrorCode[];
const catalogs: Record<string, Record<string, { message: string }>> = { en, nl };

describe('REQ-URL-003 every error code has readable text', () => {
  it.each(codes)('%s has a message in en and nl', (code) => {
    const key = errorMessageKey(code);
    for (const [locale, messages] of Object.entries(catalogs)) {
      expect(messages[key]?.message.trim(), `${locale}.${key}`).toBeTruthy();
    }
  });

  it('gives every code its own message key', () => {
    const keys = codes.map((code) => errorMessageKey(code));
    expect(new Set(keys).size).toBe(codes.length);
  });

  it('derives the key from the code', () => {
    expect(errorMessageKey('patternEmpty')).toBe('errorPatternEmpty');
    expectTypeOf(errorMessageKey('patternEmpty')).toEqualTypeOf<'errorPatternEmpty'>();
  });

  it('explains a misplaced host wildcard in words (spec example)', () => {
    const key = errorMessageKey('patternWildcardInHost');
    expect(en[key].message).toBe('A wildcard is only allowed at the start of the host.');
  });

  it('only produces keys that exist in both catalogs (type level)', () => {
    expectTypeOf<ErrorMessageKey>().toExtend<keyof typeof en>();
    expectTypeOf<ErrorMessageKey>().toExtend<keyof typeof nl>();
  });
});
