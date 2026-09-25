import type { UrlPatternErrorCode } from '../errors';
import { err, ok, type Result } from '../result';
import { isPublicSuffix } from './broad';
import { isIpAddress, normalizeHost, parsePort, splitHostPort } from './host';

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

type Code = UrlPatternErrorCode;

/** REQ-URL-010: at most 500 characters (input and stored form) and 10 wildcards. */
const MAX_LENGTH = 500;
const MAX_WILDCARDS = 10;
/** The browser's match-everything pattern (REQ-URL-009). */
const ALL_URLS = '<all_urls>';

/** `scheme://` at the start: everything before the first `://`, if no `/?#:` comes earlier. */
const SCHEME_PREFIX = /^([^/?#:[\]]*):\/\//;
/** Schemes written without `//` (`about:blank`); anything else before a `:` is a host. */
const OPAQUE_SCHEME = /^(about|blob|data|file|javascript|mailto|tel|view-source):/i;
const SCHEMES: readonly string[] = ['http', 'https', '*'] satisfies WildcardScheme[];
/** Characters a browser percent-encodes in a path or query: controls, space, `"`, `<`, `>`. */
const ENCODED = /[^!#-;=?-~]/gu;

function isScheme(text: string): text is WildcardScheme {
  return SCHEMES.includes(text);
}

function splitScheme(text: string): Result<{ scheme: WildcardScheme; rest: string }, Code> {
  const prefix = SCHEME_PREFIX.exec(text);
  if (!prefix) {
    return OPAQUE_SCHEME.test(text) ? err('patternInvalidScheme') : ok({ scheme: '*', rest: text });
  }
  const scheme = (prefix[1] ?? '').toLowerCase();
  if (!isScheme(scheme)) return err('patternInvalidScheme');
  return ok({ scheme, rest: text.slice(prefix[0].length) });
}

function encodeChar(char: string): string {
  try {
    return encodeURIComponent(char);
  } catch {
    return '%EF%BF%BD'; // a lone surrogate becomes U+FFFD, as in a browser
  }
}

/** The pattern's path (and query), fragment dropped and encoded like a browser URL. */
function normalizePath(tail: string): string {
  const hash = tail.indexOf('#');
  const path = hash < 0 ? tail : tail.slice(0, hash);
  if (path === '') return '/*';
  return (path.startsWith('?') ? `/${path}` : path).replace(ENCODED, encodeChar);
}

type Authority = { host: string; includeSubdomains: boolean; port: number | undefined };

function parseHost(raw: string): Result<{ host: string; includeSubdomains: boolean }, Code> {
  if (raw === '*') return err('patternTooBroad');
  const includeSubdomains = raw.startsWith('*.');
  const bare = includeSubdomains ? raw.slice(2) : raw;
  if (bare.includes('*')) return err('patternWildcardInHost');
  const host = normalizeHost(bare);
  if (!host.ok) return host;
  if (includeSubdomains && isIpAddress(host.value)) return err('patternInvalidHost');
  if (includeSubdomains && isPublicSuffix(host.value)) return err('patternTooBroad');
  return ok({ host: host.value, includeSubdomains });
}

function parseAuthority(authority: string): Result<Authority, Code> {
  const wildcard = authority.startsWith('*.') ? '*.' : '';
  const split = splitHostPort(authority.slice(wildcard.length));
  if (!split.ok) return split;
  const host = parseHost(wildcard + split.value.host);
  if (!host.ok) return host;
  if (split.value.port === undefined) return ok({ ...host.value, port: undefined });
  const port = parsePort(split.value.port);
  return port.ok ? ok({ ...host.value, port: port.value }) : port;
}

/** Parses and validates a wildcard pattern or its shorthand. Never throws (D-225). */
export function parseWildcard(input: string): Result<ParsedWildcard, UrlPatternErrorCode> {
  const text = input.trim();
  if (text === '') return err('patternEmpty');
  if (text.toLowerCase() === ALL_URLS) return err('patternTooBroad');
  if (text.length > MAX_LENGTH) return err('patternTooLong');
  if (text.split('*').length - 1 > MAX_WILDCARDS) return err('patternTooManyWildcards');
  const split = splitScheme(text);
  if (!split.ok) return split;
  const { scheme, rest } = split.value;
  const end = rest.search(/[/?#]/);
  const authority = parseAuthority(end < 0 ? rest : rest.slice(0, end));
  if (!authority.ok) return authority;
  const path = normalizePath(end < 0 ? '' : rest.slice(end));
  const parsed = { scheme, ...authority.value, path, matchesQuery: path.includes('?') };
  return formatWildcard(parsed).length > MAX_LENGTH ? err('patternTooLong') : ok(parsed);
}

/** The canonical text of a parsed pattern: `scheme://[*.]host[:port]/path`. */
export function formatWildcard(parsed: ParsedWildcard): string {
  const host = `${parsed.includeSubdomains ? '*.' : ''}${parsed.host}`;
  const port = parsed.port === undefined ? '' : `:${parsed.port}`;
  return `${parsed.scheme}://${host}${port}${parsed.path}`;
}

/** Parses `input` and returns its canonical text, the form that is stored. */
export function normalizeWildcard(input: string): Result<string, UrlPatternErrorCode> {
  const parsed = parseWildcard(input);
  return parsed.ok ? ok(formatWildcard(parsed.value)) : parsed;
}
