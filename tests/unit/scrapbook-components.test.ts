import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The UI kit draws paper sheets and controls with an ink outline (D-289, docs/design.md §4).

const read = (file: string) => readFileSync(file, 'utf8');
const tokens = read('src/styles/tokens.css');
const moduleCss = (component: string) => read(`src/ui/components/${component}.module.css`);

const outlined = [
  'Button',
  'IconButton',
  'Card',
  'Dialog',
  'Toast',
  'Field',
  'Segmented',
  'Switch',
  'Slider',
  'ColorSwatches',
];

describe('REQ-A11Y-008 controls and sheets draw a 1.5 px ink outline', () => {
  it.each(outlined)('%s uses --sm-control-border for its boundary', (component) => {
    expect(moduleCss(component)).toMatch(/border:\s*1\.5px solid var\(--sm-control-border\)/);
  });

  it.each(outlined)('%s no longer paints the soft top-left edge highlight', (component) => {
    expect(moduleCss(component)).not.toMatch(/border-(top|left)-color:\s*var\(--sm-paper-edge\)/);
  });
});

describe('REQ-A11Y-001 tape fills carry ink text in both themes', () => {
  it('declares --sm-on-tape as a fixed dark ink', () => {
    expect(tokens).toMatch(/--sm-on-tape:\s*#[0-9a-f]{6};/i);
  });

  it('selected buttons and segments use the tape fill with --sm-on-tape', () => {
    for (const component of ['Button', 'Segmented']) {
      expect(moduleCss(component), component).toMatch(/background:\s*var\(--sm-tape-1\)/);
      expect(moduleCss(component), component).toMatch(/color:\s*var\(--sm-on-tape\)/);
    }
  });
});

describe('REQ-A11Y-007 tilt is decoration and switches off', () => {
  const zeroedIn = (query: string) =>
    new RegExp(`@media \\(${query}\\)\\s*{[^@]*--sm-tilt:\\s*0deg`).test(tokens);

  it('defines --sm-tilt', () => {
    expect(tokens).toMatch(/--sm-tilt:\s*1\.5deg;/);
  });

  it.each(['prefers-reduced-motion: reduce', 'forced-colors: active'])(
    'is 0deg under %s',
    (query) => {
      expect(zeroedIn(query)).toBe(true);
    },
  );
});

describe('REQ-THEME-001 the type scale and controls follow the concept', () => {
  it('sets handwriting text at the concept sizes', () => {
    expect(tokens).toMatch(/--sm-text-md:\s*18px;/);
    expect(tokens).toMatch(/--sm-text-lg:\s*20px;/);
  });

  it('has no inset wells: paper controls are outlined, not sunken', () => {
    expect(tokens).toMatch(/--sm-well:\s*none;/);
  });

  it('draws the switch as a 62 × 34 track with a solid ink thumb', () => {
    const css = moduleCss('Switch');
    expect(css).toMatch(/\.track\s*{[^}]*width:\s*62px;[^}]*height:\s*34px;/);
    expect(css).toMatch(
      /\.knob\s*{[^}]*width:\s*22px;[^}]*background:\s*var\(--sm-control-border\)/,
    );
  });

  it('divides the segmented control with ink lines, also when it wraps, and fills the selected segment', () => {
    const css = moduleCss('Segmented');
    expect(css).toMatch(/border-inline-start:\s*1\.5px solid var\(--sm-control-border\)/);
    expect(css).toMatch(/border-block-start:\s*1\.5px solid var\(--sm-control-border\)/);
    expect(css).not.toMatch(/box-shadow:\s*var\(--sm-well\)/);
  });
});

describe('REQ-THEME-001 washi tape is striped, not solid', () => {
  const base = read('src/styles/base.css');

  it('defines the stripe overlay as a token', () => {
    expect(tokens).toMatch(/--sm-tape-stripes:\s*repeating-linear-gradient\(\s*45deg/);
  });

  it('draws .sm-tape strips from the stripes over a tape color, and hides them in forced colors', () => {
    expect(base).toMatch(/\.sm-tape::before\s*{[^}]*var\(--sm-tape-stripes\), var\(--tape/);
    expect(base).toMatch(/forced-colors: active\)[^@]*\.sm-tape::before\s*{\s*display:\s*none/);
  });
});
