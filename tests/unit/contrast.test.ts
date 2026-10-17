import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Reads the real tokens.css so a palette edit can't silently break WCAG contrast (docs/design.md §2, D-289).
// The contrast math lives here on purpose: the product version arrives with T-043 (src/core/model/color.ts).

const css = readFileSync('src/styles/tokens.css', 'utf8');

function block(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`tokens.css has no "${selector}" block`);
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
  const withoutComments = body.replace(/\/\*[\s\S]*?\*\//g, '');
  return Object.fromEntries(
    [...withoutComments.matchAll(/(--sm-[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2]?.trim()]),
  );
}

const light = block(':root');
const darkMedia = block(":root:not([data-theme='light'])");
const darkForced = block(":root[data-theme='dark']");
const themes = { light, dark: { ...light, ...darkForced } };

function hex(tokens: Record<string, string>, name: string): string {
  const value = tokens[name];
  const ref = value?.match(/^var\((--sm-[\w-]+)\)$/)?.[1];
  if (ref) return hex(tokens, ref);
  expect(value ?? '', `${name} is an opaque hex color`).toMatch(/^#[0-9a-f]{3}([0-9a-f]{3})?$/i);
  return value?.length === 4 ? `#${[...value.slice(1)].map((c) => c + c).join('')}` : (value ?? '');
}

/** A translucent `rgb(r g b / a%)` token painted over an opaque one, as `#rrggbb`. */
function over(tokens: Record<string, string>, name: string, backdrop: string): string {
  const match = tokens[name]?.match(/^rgb\((\d+) (\d+) (\d+) \/ (\d+)%\)$/);
  expect(match, `${name} is an rgb(r g b / a%) color`).not.toBeNull();
  if (!match) return backdrop;
  const alpha = Number(match[4]) / 100;
  const base = hex(tokens, backdrop);
  const channel = (i: number) => {
    const under = Number.parseInt(base.slice(1 + 2 * i, 3 + 2 * i), 16);
    const mixed = Math.round(Number(match[i + 1]) * alpha + under * (1 - alpha));
    return mixed.toString(16).padStart(2, '0');
  };
  return `#${channel(0)}${channel(1)}${channel(2)}`;
}

function luminance(color: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = Number.parseInt(color.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

// D-289: text on the kraft board is ink only. Every text token reads on the paper surfaces.
const paper = ['--sm-surface', '--sm-surface-2', '--sm-soft'];
const textOnPaper = [
  '--sm-text',
  '--sm-text-muted',
  '--sm-accent-text',
  '--sm-success',
  '--sm-warning',
  '--sm-danger',
];

describe.each(Object.entries(themes))('%s theme', (_theme, tokens) => {
  const ratio = (fg: string, bg: string) => contrast(hex(tokens, fg), hex(tokens, bg));

  describe('REQ-A11Y-001 text meets WCAG AA (4.5:1)', () => {
    it('--sm-text on the board', () => {
      expect(ratio('--sm-text', '--sm-bg')).toBeGreaterThanOrEqual(4.5);
    });

    it.each(textOnPaper.flatMap((fg) => paper.map((bg) => [fg, bg])))('%s on %s', (fg, bg) => {
      expect(ratio(fg, bg)).toBeGreaterThanOrEqual(4.5);
    });

    it('--sm-on-accent on --sm-accent', () => {
      expect(ratio('--sm-on-accent', '--sm-accent')).toBeGreaterThanOrEqual(4.5);
    });

    // The quiet button's hover and the picker's pressed chip sit on paper: accent text on the soft accent fill.
    it('--sm-accent-text on --sm-accent-soft over --sm-surface', () => {
      const fill = over(tokens, '--sm-accent-soft', '--sm-surface');
      expect(contrast(hex(tokens, '--sm-accent-text'), fill)).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe('REQ-A11Y-008 control boundaries and focus meet 3:1 (WCAG 1.4.11)', () => {
    it.each(['--sm-control-border', '--sm-focus-color'])('%s on the board and the paper', (fg) => {
      for (const bg of ['--sm-bg', ...paper])
        expect(ratio(fg, bg), `${fg} on ${bg}`).toBeGreaterThanOrEqual(3);
    });
  });
});

describe.each(Object.entries(themes))('REQ-A11Y-001 %s tape fills', (_theme, tokens) => {
  it.each(['--sm-tape-1', '--sm-tape-2', '--sm-tape-3', '--sm-tape-4'])(
    '--sm-on-tape on %s',
    (tape) => {
      expect(contrast(hex(tokens, '--sm-on-tape'), hex(tokens, tape))).toBeGreaterThanOrEqual(4.5);
    },
  );
});

describe('REQ-A11Y-001 the two dark-theme blocks stay identical', () => {
  it('uses the same values for the OS preference and data-theme="dark"', () => {
    expect(darkMedia).toEqual(darkForced);
  });
});
