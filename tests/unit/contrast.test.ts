import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Reads the real tokens.css so a palette edit can't silently break WCAG contrast (docs/design.md §2).
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
  if (!value || !/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(value)) {
    throw new Error(`${name} is not an opaque hex color: ${value}`);
  }
  return value.length === 4 ? `#${[...value.slice(1)].map((c) => c + c).join('')}` : value;
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

const textOnBackground = [
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
    it.each(textOnBackground.flatMap((fg) => ['--sm-bg', '--sm-surface'].map((bg) => [fg, bg])))(
      '%s on %s',
      (fg, bg) => {
        expect(ratio(fg, bg)).toBeGreaterThanOrEqual(4.5);
      },
    );

    it('--sm-on-accent on --sm-accent', () => {
      expect(ratio('--sm-on-accent', '--sm-accent')).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe('REQ-A11Y-008 control boundaries and focus meet 3:1 (WCAG 1.4.11)', () => {
    it.each(['--sm-control-border', '--sm-focus-color'])('%s on the background', (fg) => {
      expect(ratio(fg, '--sm-bg')).toBeGreaterThanOrEqual(3);
      expect(ratio(fg, '--sm-surface')).toBeGreaterThanOrEqual(3);
    });
  });
});

describe('REQ-A11Y-001 the two dark-theme blocks stay identical', () => {
  it('uses the same values for the OS preference and data-theme="dark"', () => {
    expect(darkMedia).toEqual(darkForced);
  });
});
