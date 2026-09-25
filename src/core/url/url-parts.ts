import { notImplemented } from '../not-implemented';

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

/**
 * Splits a browser URL (normally already normalized, with an ASCII host) into comparable parts.
 * Returns `undefined` for anything that isn't a `scheme://host…` URL with a valid host.
 */
export function parseUrl(_url: string): UrlParts | undefined {
  return notImplemented();
}
