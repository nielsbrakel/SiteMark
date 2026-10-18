import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The logo is a torn paper ribbon with a pick cursor, drawn flat with an ink outline (D-289, docs/design.md §3).

const svg = (file: string) => readFileSync(file, 'utf8');
const color = [
  'design/logo/sitemark-icon.svg',
  'design/logo/sitemark-icon-small.svg',
  'design/logo/sitemark-icon-16.svg',
  'src/assets/logo.svg',
];
const wordmarks = ['design/logo/sitemark-wordmark.svg', 'design/logo/sitemark-wordmark-dark.svg'];

describe('REQ-THEME-001 the logo is flat paper with an ink outline', () => {
  it.each([...color, ...wordmarks])('%s has no gradients, filters or soft shadows', (file) => {
    expect(svg(file)).not.toMatch(/<(linearGradient|radialGradient|filter|feDropShadow)/);
  });

  it.each(color)('%s outlines the ribbon in ink', (file) => {
    expect(svg(file)).toMatch(/stroke="#33261b"/);
  });

  it('the master icon has a transparent background (no tile)', () => {
    expect(svg('design/logo/sitemark-icon.svg')).not.toMatch(/<rect[^>]*width="108"/);
  });
});

describe('REQ-WEB-003 the wordmark is outlined lettering, not a font reference', () => {
  it.each(wordmarks)('%s draws the letters as paths', (file) => {
    const markup = svg(file);
    expect(markup).not.toMatch(/<text|font-family/);
    expect(markup).toMatch(/<path[^>]*aria-hidden|<g[^>]*aria-hidden/);
  });

  it('the dark wordmark uses cream and the light accent', () => {
    const markup = svg('design/logo/sitemark-wordmark-dark.svg');
    expect(markup).toContain('#f7f0e3');
    expect(markup).toContain('#ff9d80');
  });
});

describe('REQ-THEME-001 the wordmark carries the full torn-note logo and a highlighter stroke', () => {
  it.each(wordmarks)('%s draws the paper note behind the ribbon', (file) => {
    expect(svg(file)).toMatch(/<g transform="rotate\(-5 64 64\)"><path d="M16 14l46-2/);
  });

  it('puts "Mark" in coral on a mustard stroke in the light wordmark', () => {
    const markup = svg('design/logo/sitemark-wordmark.svg');
    expect(markup).toMatch(/<rect x="289"[^>]*fill="#f5cf5a"/);
    expect(markup).toMatch(/<path aria-hidden="true" fill="#e8664d"/);
  });
});
