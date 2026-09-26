import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { assertProperty } from '../testing/property';
import { urlNear, wildcardInput } from '../testing/url-arbitraries';
import { matchUrlPattern } from './match';
import { originMatches, toOriginPattern } from './origin';
import { formatWildcard, normalizeWildcard, type ParsedWildcard, parseWildcard } from './parse';
import { parseUrl } from './url-parts';

// T-058: properties of the wildcard parser over messy user input (shorthand, casing, IDN, IPs,
// ports, paths that need encoding). Invalid input is skipped; valid input must be stable.

function parsedOrSkip(input: string): ParsedWildcard {
  const parsed = parseWildcard(input);
  fc.pre(parsed.ok);
  return (parsed as { value: ParsedWildcard }).value;
}

describe('REQ-URL-001 property: parse → format → parse round-trip', () => {
  it('parses the canonical form back to the same pattern', () => {
    assertProperty(
      fc.property(wildcardInput, (input) => {
        const parsed = parsedOrSkip(input);
        expect(parseWildcard(formatWildcard(parsed))).toEqual({ ok: true, value: parsed });
      }),
    );
  });

  it('normalizes idempotently', () => {
    assertProperty(
      fc.property(wildcardInput, (input) => {
        const canonical = normalizeWildcard(input);
        fc.pre(canonical.ok);
        if (!canonical.ok) return;
        expect(normalizeWildcard(canonical.value)).toEqual(canonical);
      }),
    );
  });

  it('generates enough valid and invalid patterns to mean something', () => {
    const valid = fc.sample(wildcardInput, 500).filter((input) => parseWildcard(input).ok);
    expect(valid.length).toBeGreaterThan(150);
    expect(valid.length).toBeLessThan(500);
  });

  it('never throws, on any string', () => {
    const anyText = fc.oneof(fc.string({ unit: 'binary' }), wildcardInput);
    assertProperty(
      fc.property(anyText, (input) => {
        const result = normalizeWildcard(input);
        expect(typeof result.ok).toBe('boolean');
      }),
    );
  });
});

describe('REQ-URL-001 REQ-URL-005 property: a stored pattern that matches implies its origin matches', () => {
  it('holds for URLs built near each valid pattern', () => {
    let matched = 0;
    const scenario = wildcardInput
      .map((input) => parseWildcard(input))
      .filter((parsed) => parsed.ok)
      .chain((parsed) => {
        const pattern = (parsed as { value: ParsedWildcard }).value;
        return urlNear(pattern).map((url) => ({ pattern, url }));
      });
    assertProperty(
      fc.property(scenario, ({ pattern, url }) => {
        const parts = parseUrl(url);
        const stored = { kind: 'wildcard', value: formatWildcard(pattern) } as const;
        if (!(parts && matchUrlPattern(stored, parts))) return;
        matched += 1;
        expect(originMatches(toOriginPattern(pattern), parts)).toBe(true);
      }),
    );
    expect(matched).toBeGreaterThan(50);
  });
});
