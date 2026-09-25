// IP address literals in hosts. Only the canonical forms are accepted, so a pattern never depends on
// the WHATWG URL parser's legacy IPv4 forms (hex, octal, fewer than four parts).

const IPV4_PART = /^(0|[1-9]\d{0,2})$/;
const IPV6_GROUP = /^[0-9a-f]{1,4}$/i;

/** `192.168.0.1` → [192, 168, 0, 1]; `undefined` unless it is a canonical dotted quad. */
export function parseIpv4(text: string): number[] | undefined {
  const parts = text.split('.');
  if (parts.length !== 4 || !parts.every((part) => IPV4_PART.test(part))) return undefined;
  const bytes = parts.map(Number);
  return bytes.every((byte) => byte <= 255) ? bytes : undefined;
}

/** The 16-bit pieces of a run of `:`-separated groups; the last group may be an IPv4 address. */
function parseGroups(text: string, allowIpv4: boolean): number[] | undefined {
  if (text === '') return [];
  const groups = text.split(':');
  const pieces: number[] = [];
  for (const [index, group] of groups.entries()) {
    const ipv4 = allowIpv4 && index === groups.length - 1 ? parseIpv4(group) : undefined;
    if (ipv4) {
      pieces.push(((ipv4[0] ?? 0) << 8) | (ipv4[1] ?? 0), ((ipv4[2] ?? 0) << 8) | (ipv4[3] ?? 0));
    } else if (IPV6_GROUP.test(group)) {
      pieces.push(Number.parseInt(group, 16));
    } else {
      return undefined;
    }
  }
  return pieces;
}

/** The eight pieces of an IPv6 address, or `undefined` when it isn't one. */
function parseIpv6(text: string): number[] | undefined {
  const halves = text.split('::');
  if (halves.length > 2) return undefined;
  const [head = '', tail] = halves;
  if (tail === undefined) {
    const pieces = parseGroups(head, true);
    return pieces?.length === 8 ? pieces : undefined;
  }
  const left = parseGroups(head, false);
  const right = parseGroups(tail, true);
  if (!left || !right || left.length + right.length > 7) return undefined;
  const zeros = new Array<number>(8 - left.length - right.length).fill(0);
  return [...left, ...zeros, ...right];
}

/** The first longest run of at least two zero pieces, as [start, length]. */
function longestZeroRun(pieces: number[]): [number, number] {
  let best: [number, number] = [-1, 0];
  let start = -1;
  for (let i = 0; i <= pieces.length; i++) {
    if (pieces[i] === 0) {
      if (start < 0) start = i;
      continue;
    }
    if (start >= 0 && i - start > best[1]) best = [start, i - start];
    start = -1;
  }
  return best;
}

/**
 * The canonical (WHATWG / RFC 5952) text of an IPv6 address without brackets, e.g.
 * `2001:DB8::0:1` → `2001:db8::1`, or `undefined` when `text` is not an IPv6 address.
 */
export function canonicalIpv6(text: string): string | undefined {
  const pieces = parseIpv6(text);
  if (!pieces) return undefined;
  const hex = (list: number[]) => list.map((piece) => piece.toString(16)).join(':');
  const [start, length] = longestZeroRun(pieces);
  if (length < 2) return hex(pieces);
  return `${hex(pieces.slice(0, start))}::${hex(pieces.slice(start + length))}`;
}
