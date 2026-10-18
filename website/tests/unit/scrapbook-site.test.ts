import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The website is paper sheets on the kraft board; every page is a ruled notebook page (D-289, docs/website/design.md §1, §3).

const css = (file: string) => readFileSync(`website/src/${file}.module.css`, 'utf8');
const rule = (file: string, selector: string) => {
  const match = css(file).match(new RegExp(`${selector}\\s*{([^}]*)}`));
  expect(match, `${selector} in ${file}`).not.toBeNull();
  return match?.[1] ?? '';
};

describe('REQ-WEBUX-001 pages are one paper sheet on the board', () => {
  it('the sheet that holds the header and the page is outlined with the paper lift', () => {
    const sheet = rule('components/Shell', '\\.sheet');
    expect(sheet).toMatch(/border:\s*1\.5px solid var\(--sm-control-border\)/);
    expect(sheet).toMatch(/var\(--sm-paper\)/);
    expect(sheet).toMatch(/box-shadow:\s*var\(--sm-lift\)/);
  });

  it('every sheet is ruled, with a coral margin line on the website', () => {
    const sheet = rule('components/Shell', '\\.sheet');
    expect(sheet).toMatch(/var\(--sm-paper\)/);
    expect(sheet).toMatch(/var\(--sm-accent\)/);
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
    expect(home).toMatch(/\.card\s*{[^}]*--tape:\s*var\(--sm-tape-1\)/);
    expect(home).toMatch(/\.card:nth-child\(3n \+ 2\)\s*{[^}]*--tape:\s*var\(--sm-tape-2\)/);
    expect(home).toMatch(/\.card:nth-child\(3n\)\s*{[^}]*--tape:\s*var\(--sm-tape-3\)/);
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

describe('REQ-WEBUX-001 the notebook page keeps its ruled lines on a phone', () => {
  it('the narrow layout moves the margin line in and keeps the rules', () => {
    const narrow =
      css('components/Shell').match(/@media \(width <= 720px\)\s*{([\s\S]*)}\s*$/)?.[1] ?? '';
    expect(narrow).not.toMatch(/background:\s*var\(--sm-surface\)/);
    expect(narrow).toMatch(/--margin-line/);
  });
});

describe('REQ-WEBUX-001 text sits on the ruled lines of the paper', () => {
  const tokens = readFileSync('website/src/styles/website-tokens.css', 'utf8');
  const paper = readFileSync('src/styles/tokens.css', 'utf8');

  it('one rule is as tall as the ruled row of the paper, and prose lines are one rule', () => {
    expect(tokens).toMatch(/--smw-rule:\s*32px/);
    expect(tokens).toMatch(/--smw-prose-line:\s*var\(--smw-rule\)/);
    expect(paper).toMatch(/transparent 0 31px, var\(--sm-border\) 31px 32px/);
  });

  it('the page text and the header start and end on a rule', () => {
    expect(rule('components/Shell', '\\.main')).toMatch(/line-height:\s*var\(--smw-rule\)/);
    expect(rule('components/Header', '\\.nav')).toMatch(
      /min-height:\s*calc\(var\(--smw-rule\) \* 2\)/,
    );
  });
});

describe('REQ-WEBUX-001 cards and control panels stand out from the ruled sheet', () => {
  it.each([
    'pages/HomePage|\\.card',
    'playground/Playground|\\.controls',
    'components/Callout|\\.callout',
  ])('%s is an outlined panel, not a ruled line', (entry) => {
    const [file = '', selector = ''] = entry.split('|');
    expect(rule(file, selector)).toMatch(/background:\s*var\(--sm-panel\)/);
  });

  it('the header controls share one height', () => {
    expect(rule('components/Header', '\\.tools > \\*')).toMatch(/height:\s*var\(--smw-control\)/);
    expect(rule('theme/ThemeToggle', '\\.toggle')).toMatch(/height:\s*var\(--smw-control\)/);
  });
});

describe('REQ-PAGE-009 the three notes sit in a row, and the switch adds their marks', () => {
  // The component's styles do not exist before the green step.
  const notes = existsSync('website/src/components/AtWork.module.css')
    ? css('components/AtWork')
    : '';

  it('three columns, one column when narrow', () => {
    expect(notes).toMatch(/\.notes\s*{[^}]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/);
    expect(notes).toMatch(/@media \(width <= 760px\)\s*{[^}]*\.notes\s*{[^}]*minmax\(0, 1fr\)/);
  });

  it('the marks show only while the switch is checked, with no script', () => {
    expect(notes).toMatch(/\.scene:has\(\.switch:checked\)/);
    expect(notes).toMatch(/\.switch:checked/);
    expect(notes).toMatch(/--sm-tilt/);
  });
});
