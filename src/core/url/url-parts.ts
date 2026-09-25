import { normalizeHost, parsePort, splitHostPort } from './host';

/** A URL split into the parts wildcard matching compares (REQ-URL-001). The fragment is dropped. */
export type UrlParts = {
  /** The URL without its fragment: what a regex pattern is tested against (REQ-URL-004). */
  readonly href: string;
  /** Lowercase, without `:`. */
  readonly scheme: string;
  /** Lowercase ASCII (punycode), no trailing dot; IPv6 in brackets, in canonical form. */
  readonly host: string;
  /** The explicit port, or the scheme's default (80 for http, 443 for https). */
  readonly port: number | undefined;
  /** Starts with `/`. Case is kept. */
  readonly path: string;
  /** Without the `?`; `undefined` when the URL has no `?`. */
  readonly query: string | undefined;
};

const HIERARCHICAL = /^([a-z][a-z0-9+.-]*):\/\/([^/?#]*)([^#]*)/is;
const DEFAULT_PORTS: Readonly<Record<string, number>> = { http: 80, https: 443 };

function withoutUserInfo(authority: string): string {
  return authority.slice(authority.lastIndexOf('@') + 1);
}

function resolvePort(scheme: string, port: string | undefined): number | undefined | false {
  if (port === undefined || port === '') return DEFAULT_PORTS[scheme];
  const parsed = parsePort(port);
  return parsed.ok ? parsed.value : false;
}

/**
 * Splits a browser URL (normally already normalized, with an ASCII host) into comparable parts.
 * Returns `undefined` for anything that isn't a `scheme://host…` URL with a valid host.
 */
export function parseUrl(url: string): UrlParts | undefined {
  const match = HIERARCHICAL.exec(url);
  if (!match) return undefined;
  const [href = '', rawScheme = '', authority = '', rest = ''] = match;
  const scheme = rawScheme.toLowerCase();
  const split = splitHostPort(withoutUserInfo(authority));
  const host = split.ok ? normalizeHost(split.value.host) : split;
  const port = split.ok ? resolvePort(scheme, split.value.port) : false;
  if (!host.ok || port === false) return undefined;
  const queryStart = rest.indexOf('?');
  const path = queryStart < 0 ? rest : rest.slice(0, queryStart);
  return {
    href,
    scheme,
    host: host.value,
    port,
    path: path || '/',
    query: queryStart < 0 ? undefined : rest.slice(queryStart + 1),
  };
}
