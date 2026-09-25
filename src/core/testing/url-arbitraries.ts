import fc from 'fast-check';
import { type OriginPattern, parseOriginPattern } from '../url/origin';
import { normalizeWildcard, type ParsedWildcard } from '../url/parse';
import { validateRegex } from '../url/regex-safety';

// fast-check generators for URL patterns (T-058): messy user input for the parser, and the canonical
// stored forms the schema-valid state generators (arbitraries.ts) build on.

const label = fc.stringMatching(/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,6}[a-zA-Z0-9])?$/);
const unicodeLabel = fc.constantFrom('bücher', 'MÜNCHEN', 'école', '例え', 'ñandú');
const suffix = fc.constantFrom('com', 'nl', 'co.uk', 'example', 'test', 'DE', 'xn--p1ai');
const dot = fc.constantFrom('.', '.', '.', '。');

const domain = fc
  .tuple(fc.array(fc.oneof(label, unicodeLabel), { minLength: 1, maxLength: 3 }), dot, suffix)
  .chain(([labels, separator, tld]) =>
    fc.constantFrom('', '.').map((trailing) => `${[...labels, tld].join(separator)}${trailing}`),
  );

const ipHost = fc.oneof(
  fc.constantFrom('localhost', '127.0.0.1', '[::1]', '[2001:DB8::1]', '[0:0:0:0:0:0:0:1]'),
  fc.ipV4(),
);

/** Hosts the parser rejects: too broad, a misplaced `*`, a space, broken IPv6. */
const badHost = fc.constantFrom('*', '*.com', '*.co.uk', 'a*b.com', 'exa mple.com', '[::1', '::1');

/** `*.` + a domain or an IP address, a plain host, or now and then an invalid one. */
const authorityHost = fc.oneof(
  { weight: 4, arbitrary: fc.tuple(fc.boolean(), domain).map(([sub, h]) => (sub ? `*.${h}` : h)) },
  { weight: 2, arbitrary: fc.tuple(fc.boolean(), ipHost).map(([sub, h]) => (sub ? `*.${h}` : h)) },
  { weight: 1, arbitrary: badHost },
);

const port = fc.oneof(
  fc.constant(''),
  fc.integer({ min: 0, max: 99_999 }).map((value) => `:${value}`),
  fc.integer({ min: 1, max: 999 }).map((value) => `:0${value}`),
);

const pathPiece = fc.constantFrom(
  ...['*', 'a', 'Z', '/', '?', 'x=1', '&', '.', '..', '%20', '%', 'é', '日本', ' ', '"', '<>'],
  ...['#frag', '\\', '~', '-', '_', '*/', '/*'],
);

const path = fc.oneof(
  fc.constant(''),
  fc.array(pathPiece, { maxLength: 8 }).map((pieces) => `/${pieces.join('')}`),
  fc.array(pathPiece, { minLength: 1, maxLength: 4 }).map((pieces) => `?${pieces.join('')}`),
);

/**
 * A wildcard pattern as a user might type it: any scheme casing or none (shorthand), IDN and
 * uppercase hosts, trailing dots, IPs, odd ports, and paths that need encoding. Many are invalid.
 */
export const wildcardInput: fc.Arbitrary<string> = fc
  .tuple(
    fc.constantFrom('', ' ', '\t'),
    fc.constantFrom('', 'http://', 'https://', '*://', 'HTTP://', 'Https://'),
    authorityHost,
    port,
    path,
  )
  .map((parts) => parts.join(''));

/** A wildcard pattern in its canonical stored form (spec §7). */
export const canonicalWildcard: fc.Arbitrary<string> = wildcardInput
  .map(normalizeWildcard)
  .filter((result) => result.ok)
  .map((result) => (result.ok ? result.value : ''));

/** A canonical origin pattern, as a regex pattern stores it. */
export const originPattern: fc.Arbitrary<OriginPattern> = canonicalWildcard
  .map((value) => parseOriginPattern(value))
  .filter((result) => result.ok)
  .map((result) => (result.ok ? result.value : ('' as OriginPattern)));

const regexTail = fc.constantFrom(
  ...['(admin|settings)/', '[a-z]+/', 'orders/\\d+', '.*', 'x?', '$', '(a|b)c*', ''],
  ...['\\?q=[^&]*', 'caf\\u00e9', '[^/]{1,20}$'],
);

/** A regex source in the safe subset (REQ-URL-004): anchored on a host, then a simple tail. */
export const regexSource: fc.Arbitrary<string> = fc
  .tuple(
    fc.constantFrom('^https://', '^https?://', ''),
    fc.array(label, { maxLength: 3 }),
    regexTail,
  )
  .map(([start, labels, tail]) => `${start}${labels.join('\\.')}${labels.length ? '/' : ''}${tail}`)
  .filter((source) => validateRegex(source).ok);

const urlFill = fc.stringMatching(/^[a-zA-Z0-9/?=.&%-]{0,6}$/);

/** A host the pattern's host covers (itself or, with `*.`, a subdomain), or an unrelated one. */
function hostNear(pattern: ParsedWildcard): fc.Arbitrary<string> {
  const subdomain = label.map((sub) => `${sub.toLowerCase()}.${pattern.host}`);
  return fc.oneof(
    { weight: 4, arbitrary: fc.constant(pattern.host) },
    { weight: pattern.includeSubdomains ? 4 : 0, arbitrary: subdomain },
    { weight: 1, arbitrary: fc.constant('unrelated.example') },
  );
}

/**
 * A URL built to be close to a parsed pattern: its host, a scheme and port that often fit, and each
 * `*` of the path replaced by a random fill. Most of them match; some don't.
 */
export function urlNear(pattern: ParsedWildcard): fc.Arbitrary<string> {
  const schemes = pattern.scheme === '*' ? ['http', 'https'] : [pattern.scheme, 'http'];
  const ports = pattern.port === undefined ? [''] : [`:${pattern.port}`, `:${pattern.port}`, ':1'];
  const stars = pattern.path.split('*').length - 1;
  return fc
    .record({
      scheme: fc.constantFrom(...schemes),
      host: hostNear(pattern),
      port: fc.constantFrom(...ports),
      fills: fc.array(urlFill, { minLength: stars, maxLength: stars }),
      fragment: fc.constantFrom('', '#top', '#a?b'),
    })
    .map(({ scheme, host, port, fills, fragment }) => {
      let index = 0;
      const tail = pattern.path.replace(/\*/g, () => fills[index++] ?? '');
      return `${scheme}://${host}${port}${tail}${fragment}`;
    });
}
