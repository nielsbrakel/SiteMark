import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The logo is a browser window wearing a coral corner ribbon, drawn flat with an ink outline and a cream die-cut border (D-289, docs/design.md §3).

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

  it.each(color)('%s outlines the window in ink', (file) => {
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

  it('the dark wordmark is a plum window with cream ink', () => {
    const dark = svg('design/logo/sitemark-wordmark-dark.svg');
    expect(dark).toMatch(/fill="#241d33"/);
    expect(dark).toMatch(/stroke="#f7f0e3"/);
    expect(dark).not.toMatch(/#fbf6e8|#33261b/);
  });

  it('the dark wordmark letters are cream', () => {
    expect(svg('design/logo/sitemark-wordmark-dark.svg')).toMatch(
      /<path aria-hidden="true" fill="#f7f0e3"/,
    );
  });
});

describe('REQ-THEME-001 the wordmark carries the window logo and one-colour lettering', () => {
  it.each(wordmarks)('%s draws the window with its corner ribbon', (file) => {
    expect(svg(file)).toMatch(/<g clip-path="url\(#w\)"><path d="M44 10L84 10/);
  });

  it('sets the light wordmark in ink, with no marker stroke', () => {
    const markup = svg('design/logo/sitemark-wordmark.svg');
    expect(markup).not.toContain('#f5cf5a');
    expect(markup).toMatch(/<path aria-hidden="true" fill="#33261b"/);
  });
});
