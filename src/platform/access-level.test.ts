import { describe, expect, it } from 'vitest';
import { acceptsLocalAccessLevel } from './access-level';

const CHROME = (version: number) =>
  `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version}.0.0.0 Safari/537.36`;
const EDGE = `${CHROME(141)} Edg/141.0.0.0`;
const FIREFOX = 'Mozilla/5.0 (X11; Linux x86_64; rv:142.0) Gecko/20100101 Firefox/142.0';
const SAFARI =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15';

describe('REQ-SEC-002 storage.local takes an access level only on Chromium 140+', () => {
  it.each([
    ['Chrome 140', true, CHROME(140)],
    ['Chrome 150', true, CHROME(150)],
    ['Edge 141', true, EDGE],
    ['Chrome 139', false, CHROME(139)],
    ['Chrome 120', false, CHROME(120)],
    ['Firefox', false, FIREFOX],
    ['Safari (storage.session only)', false, SAFARI],
    ['an unknown browser', false, 'Mozilla/5.0'],
  ])('%s → %s', (_name, expected, userAgent) => {
    expect(acceptsLocalAccessLevel(userAgent)).toBe(expected);
  });
});
