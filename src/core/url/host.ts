import type { UrlPatternErrorCode } from '../errors';
import { err, ok, type Result } from '../result';
import { canonicalIpv6, parseIpv4 } from './ip';
import { domainToAscii } from './punycode';

const MAX_HOST_LENGTH = 253;
const MAX_LABEL_LENGTH = 63;
const LABEL = /^[a-z0-9_-]+$/;
/** A last label that the URL parser would read as (part of) an IPv4 address. */
const NUMERIC_LABEL = /^(\d+|0x[0-9a-f]*)$/;
/** IDNA label separators besides `.`: ideographic, fullwidth and halfwidth full stops. */
const IDEOGRAPHIC_DOTS = /[。．｡]/gu;
/** Unbracketed text that can only be meant as an IPv6 address, like `::1` or `2001:db8::1`. */
const BARE_IPV6 = /^[0-9a-f.]*:[0-9a-f.]*:[0-9a-f:.]*$/i;
const PORT = /^\d{1,5}$/;
const MAX_PORT = 65_535;

export type HostPort = { readonly host: string; readonly port: string | undefined };

/** Splits `host[:port]` (the host may be `[ipv6]`) without validating either part. */
export function splitHostPort(authority: string): Result<HostPort, UrlPatternErrorCode> {
  if (authority.startsWith('[')) {
    const end = authority.indexOf(']');
    if (end < 0) return err('patternInvalidIpv6');
    const rest = authority.slice(end + 1);
    if (rest !== '' && !rest.startsWith(':')) return err('patternInvalidHost');
    return ok({ host: authority.slice(0, end + 1), port: rest ? rest.slice(1) : undefined });
  }
  if (BARE_IPV6.test(authority)) return err('patternInvalidIpv6');
  const colon = authority.indexOf(':');
  if (colon < 0) return ok({ host: authority, port: undefined });
  return ok({ host: authority.slice(0, colon), port: authority.slice(colon + 1) });
}

/** `8080` → 8080. Leading zeros are allowed; the port must be 0…65535. */
export function parsePort(text: string): Result<number, UrlPatternErrorCode> {
  const port = Number(text);
  return PORT.test(text) && port <= MAX_PORT ? ok(port) : err('patternInvalidPort');
}

function isValidDomain(domain: string): boolean {
  if (domain.length === 0 || domain.length > MAX_HOST_LENGTH) return false;
  const labels = domain.split('.');
  if (!labels.every((label) => label.length <= MAX_LABEL_LENGTH && LABEL.test(label))) return false;
  // Like the URL parser: a host that ends in a number must be an IPv4 address.
  return !NUMERIC_LABEL.test(labels.at(-1) ?? '') || parseIpv4(domain) !== undefined;
}

/**
 * Normalizes a host for comparison (REQ-URL-001): lowercase + NFC, IDN → punycode, one trailing dot
 * dropped, IPv6 in canonical form inside brackets. Wildcards are the caller's business.
 */
export function normalizeHost(raw: string): Result<string, UrlPatternErrorCode> {
  if (raw.startsWith('[')) {
    const ipv6 = raw.endsWith(']') ? canonicalIpv6(raw.slice(1, -1)) : undefined;
    return ipv6 === undefined ? err('patternInvalidIpv6') : ok(`[${ipv6}]`);
  }
  let host = raw.toLowerCase().normalize('NFC').replace(IDEOGRAPHIC_DOTS, '.');
  if (host.endsWith('.')) host = host.slice(0, -1);
  const ascii = domainToAscii(host);
  return isValidDomain(ascii) ? ok(ascii) : err('patternInvalidHost');
}

/** True for a normalized IPv4 or bracketed IPv6 host. */
export function isIpAddress(host: string): boolean {
  return host.startsWith('[') || parseIpv4(host) !== undefined;
}
