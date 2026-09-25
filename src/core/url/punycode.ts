// RFC 3492 Punycode (encoding only). Core has no URL global, so IDN hosts are converted here.
// Inputs are at most a few hundred code points, so the arithmetic stays far below 2^53 and the
// RFC's overflow checks are not needed.

const BASE = 36;
const T_MIN = 1;
const T_MAX = 26;
const SKEW = 38;
const DAMP = 700;
const INITIAL_BIAS = 72;
const INITIAL_N = 128;

/** Bias adaptation (RFC 3492 §6.1). */
function adapt(delta: number, numPoints: number, firstTime: boolean): number {
  let scaled = firstTime ? Math.floor(delta / DAMP) : Math.floor(delta / 2);
  scaled += Math.floor(scaled / numPoints);
  let k = 0;
  while (scaled > ((BASE - T_MIN) * T_MAX) >> 1) {
    scaled = Math.floor(scaled / (BASE - T_MIN));
    k += BASE;
  }
  return k + Math.floor(((BASE - T_MIN + 1) * scaled) / (scaled + SKEW));
}

/** 0..25 → a..z, 26..35 → 0..9. */
function digit(value: number): string {
  return String.fromCharCode(value < 26 ? 97 + value : 22 + value);
}

function threshold(k: number, bias: number): number {
  if (k <= bias) return T_MIN;
  if (k >= bias + T_MAX) return T_MAX;
  return k - bias;
}

/** The generalized variable-length integer for `delta` (RFC 3492 §3.3). */
function encodeDelta(delta: number, bias: number): string {
  let output = '';
  let q = delta;
  for (let k = BASE; ; k += BASE) {
    const t = threshold(k, bias);
    if (q < t) break;
    output += digit(t + ((q - t) % (BASE - t)));
    q = Math.floor((q - t) / (BASE - t));
  }
  return output + digit(q);
}

/** RFC 3492 Punycode encoding of one label, without the `xn--` prefix. */
export function punycodeEncode(label: string): string {
  const codePoints = Array.from(label, (char) => char.codePointAt(0) ?? 0);
  const basic = codePoints.filter((cp) => cp < 0x80);
  let output = String.fromCharCode(...basic);
  const basicCount = basic.length;
  if (basicCount > 0) output += '-';
  let handled = basicCount;
  let n = INITIAL_N;
  let delta = 0;
  let bias = INITIAL_BIAS;
  while (handled < codePoints.length) {
    const next = Math.min(...codePoints.filter((cp) => cp >= n));
    delta += (next - n) * (handled + 1);
    n = next;
    for (const cp of codePoints) {
      if (cp < n) delta++;
      if (cp !== n) continue;
      output += encodeDelta(delta, bias);
      bias = adapt(delta, handled + 1, handled === basicCount);
      delta = 0;
      handled++;
    }
    delta++;
    n++;
  }
  return output;
}

const NON_ASCII = /[\u0080-\u{10ffff}]/u;

/** Converts every non-ASCII label of `domain` to `xn--` + Punycode. Expects lowercase NFC input. */
export function domainToAscii(domain: string): string {
  return domain
    .split('.')
    .map((label) => (NON_ASCII.test(label) ? `xn--${punycodeEncode(label)}` : label))
    .join('.');
}
