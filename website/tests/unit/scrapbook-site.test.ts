import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The website is paper sheets on the kraft board; the home page is a ruled notebook page (D-289, docs/website/design.md §1, §3).

const css = (file: string) => readFileSync(`website/src/${file}.module.css`, 'utf8');
const rule = (file: string, selector: string) => {
  const match = css(file).match(new RegExp(`${selector}\\s*{([^}]*)}`));
  expect(match, `${selector} in ${file}`).not.toBeNull();
  return match?.[1] ?? '';
};

describe('REQ-WEBUX-001 pages are one paper sheet on the board', () => {
  it('main is an outlined sheet with the paper lift', () => {
    const main = rule('components/Shell', '\\.main');
    expect(main).toMatch(/border:\s*1\.5px solid var\(--sm-control-border\)/);
    expect(main).toMatch(/background:\s*var\(--sm-surface\)/);
    expect(main).toMatch(/box-shadow:\s*var\(--sm-lift\)/);
  });

  it('the home page sheet is ruled with a coral margin line', () => {
    const notebook = rule('components/Shell', '\\.notebook');
    expect(notebook).toMatch(/repeating-linear-gradient/);
    expect(notebook).toMatch(/var\(--sm-accent\)/);
  });

  it.each(['components/Header', 'components/Footer'])(
    '%s sits on the board, so its text is --sm-text only',
    (file) => {
      expect(css(file)).not.toMatch(/--sm-text-muted/);
    },
  );
});

describe('REQ-WEBUX-001 highlight cards are taped and tilted', () => {
  it('each card carries a tape strip and alternating tilts that follow --sm-tilt', () => {
    const home = css('pages/HomePage');
    expect(home).toMatch(/\.card::before\s*{[^}]*var\(--sm-tape-1\)/);
    expect(home).toMatch(/\.card:nth-child\(odd\)\s*{[^}]*rotate\(var\(--sm-tilt\)\)/);
    expect(home).toMatch(
      /\.card:nth-child\(even\)\s*{[^}]*rotate\(calc\(-1 \* var\(--sm-tilt\)\)\)/,
    );
  });
});

describe('REQ-A11Y-001 text on the board is --sm-text only', () => {
  it('the current nav link is told apart by its underline, not by an accent color', () => {
    const base = readFileSync('src/styles/base.css', 'utf8');
    const current = base.match(/\.sm-nav-link\[aria-current='page'\]\s*{([^}]*)}/)?.[1] ?? '';
    expect(current).toMatch(/text-decoration:\s*underline/);
    expect(current).not.toMatch(/--sm-accent-text/);
  });

  it('the 404 page is a paper sheet, so its accent links read on paper', () => {
    expect(rule('pages/NotFoundPage', '\\.page')).toMatch(/background:\s*var\(--sm-surface\)/);
  });
});
