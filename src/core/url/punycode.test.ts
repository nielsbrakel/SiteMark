import { describe, expect, it } from 'vitest';
import { domainToAscii, punycodeEncode } from './punycode';

describe('REQ-URL-001 IDN hosts are converted to punycode (RFC 3492)', () => {
  it.each([
    ['bücher', 'bcher-kva'],
    ['münchen', 'mnchen-3ya'],
    // RFC 3492 §7.1 sample strings (A), (B), (L) and (S).
    ['ليهمابتكلموشعربي؟', 'egbpdaj6bu4bxfgehfvwxn'],
    ['他们为什么不说中文', 'ihqwcrb4cv8a8dqg056pqjye'],
    ['3年B組金八先生', '3B-ww4c5e180e575a65lsy2b'],
    ['-> $1.00 <-', '-> $1.00 <--'],
  ])('encodes %s as %s', (input, expected) => {
    expect(punycodeEncode(input)).toBe(expected);
  });

  it('encodes emoji, including code points outside the BMP', () => {
    expect(punycodeEncode('i❤️')).toBe('i-7iqv272g');
    expect(punycodeEncode('😀')).toBe('e28h');
  });

  it('prefixes only the labels that need it with xn--', () => {
    expect(domainToAscii('bücher.de')).toBe('xn--bcher-kva.de');
    expect(domainToAscii('www.münchen.example')).toBe('www.xn--mnchen-3ya.example');
    expect(domainToAscii('example.com')).toBe('example.com');
  });
});
