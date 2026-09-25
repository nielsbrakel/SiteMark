import { notImplemented } from '../not-implemented';

/** RFC 3492 Punycode encoding of one label, without the `xn--` prefix. */
export function punycodeEncode(_label: string): string {
  return notImplemented();
}

/** Converts every non-ASCII label of `domain` to `xn--` + Punycode. Expects lowercase NFC input. */
export function domainToAscii(_domain: string): string {
  return notImplemented();
}
