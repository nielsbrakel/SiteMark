import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// The handwriting faces ship inside the extension and the website; nothing is fetched (D-289).

const read = (file: string) => (existsSync(file) ? readFileSync(file, 'utf8') : '');
const fonts = read('src/styles/fonts.css');
const tokens = read('src/styles/tokens.css');

const faces = [
  { family: 'Caveat Brush', licence: 'OFL-caveat-brush.txt' },
  { family: 'Patrick Hand', licence: 'OFL-patrick-hand.txt' },
];

describe.each(faces)('REQ-WEB-003 $family is bundled, never fetched', ({ family, licence }) => {
  const face = fonts.match(new RegExp(`@font-face\\s*\\{[^}]*'${family}'[^}]*\\}`))?.[0] ?? '';
  const file = face.match(/url\(\s*['"]?(\.\.?\/[^'")]+\.woff2)['"]?\s*\)/)?.[1];

  it('is declared from a local woff2 file that exists', () => {
    expect(file, `${family} src`).toBeDefined();
    expect(existsSync(path.join('src/styles', file ?? 'missing'))).toBe(true);
  });

  it('shows fallback text first', () => {
    expect(face).toContain('font-display: swap');
  });

  it('ships its licence', () => {
    expect(existsSync(path.join('src/assets/fonts', licence))).toBe(true);
  });
});

describe('REQ-WEB-003 no stylesheet loads a remote resource', () => {
  const css = ['src', 'website/src']
    .flatMap((dir) =>
      readdirSync(dir, { recursive: true, encoding: 'utf8' }).map((f) => path.join(dir, f)),
    )
    .filter((file) => file.endsWith('.css'));

  it.each(css)('%s', (file) => {
    expect(read(file)).not.toMatch(/url\(\s*['"]?(https?:)?\/\//);
  });
});

describe('REQ-THEME-002 fonts are wired into the shared styles', () => {
  it('base.css imports fonts.css', () => {
    expect(read('src/styles/base.css')).toContain("@import url('./fonts.css')");
  });

  // The picker inlines tokens.css into a web page, where the bundled files are not reachable.
  it('tokens.css declares no @font-face', () => {
    expect(tokens).not.toContain('@font-face');
  });

  it('the font stacks lead with the handwriting faces and keep a system fallback', () => {
    expect(tokens).toMatch(/--sm-font:\s*'Patrick Hand',[^;]*system-ui/);
    expect(tokens).toMatch(/--sm-font-display:\s*'Caveat Brush',[^;]*system-ui/);
  });

  it('keeps text at 14 px or more: handwriting has a small x-height', () => {
    const sizes = [...tokens.matchAll(/--sm-text-\w+:\s*(\d+)px/g)].map((m) => Number(m[1]));
    expect(sizes.length).toBeGreaterThan(0);
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(14);
  });
});
