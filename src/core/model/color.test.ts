import { describe, expect, it } from 'vitest';
import { autoTextColor, contrastRatio, resolveTextColor } from './color';
import { colorPresets, presetColor } from './presets';
import type { Hex } from './schema';

const hex = (value: string) => value as Hex;
const BLACK = hex('#000000');
const WHITE = hex('#ffffff');

/** Every color on a coarse RGB grid (step 0x33: 216 colors). */
const grid = (): Hex[] => {
  const steps = ['00', '33', '66', '99', 'cc', 'ff'];
  return steps.flatMap((r) => steps.flatMap((g) => steps.map((b) => hex(`#${r}${g}${b}`))));
};

describe('REQ-MARK-011 WCAG contrast ratio', () => {
  it.each([
    ['#000000', '#ffffff', 21],
    ['#ffffff', '#000000', 21],
    ['#1f6feb', '#1f6feb', 1],
    ['#777777', '#ffffff', 4.48],
    ['#ff0000', '#ffffff', 4],
    ['#0000ff', '#ffffff', 8.59],
  ])('%s vs %s → %d', (a, b, expected) => {
    expect(contrastRatio(hex(a), hex(b))).toBeCloseTo(expected, 2);
  });
});

describe('REQ-MARK-011 auto text color is black or white, whichever contrasts more', () => {
  it.each([
    ['#000000', WHITE],
    ['#ffffff', BLACK],
    ['#ffff00', BLACK],
    ['#0000ff', WHITE],
    ['#c93a2e', WHITE],
    ['#f4a300', BLACK],
    ['#1f6feb', WHITE],
    ['#57606a', WHITE],
  ])('on %s → %s', (color, expected) => {
    expect(autoTextColor(hex(color))).toBe(expected);
  });

  it('never picks the lower-contrast option', () => {
    for (const color of grid()) {
      const picked = autoTextColor(color);
      const other = picked === BLACK ? WHITE : BLACK;
      expect(contrastRatio(color, picked)).toBeGreaterThanOrEqual(contrastRatio(color, other));
    }
  });

  it('resolves auto to the automatic color and keeps an explicit one', () => {
    expect(resolveTextColor({ color: hex('#f4a300'), textColor: 'auto' })).toBe(BLACK);
    expect(resolveTextColor({ color: hex('#f4a300'), textColor: hex('#123456') })).toBe('#123456');
  });
});

describe('REQ-MARK-012 color presets (D-205)', () => {
  it('offers red, amber, blue and slate, in that order', () => {
    expect(colorPresets()).toEqual([
      { name: 'red', color: '#c93a2e' },
      { name: 'amber', color: '#f4a300' },
      { name: 'blue', color: '#1f6feb' },
      { name: 'slate', color: '#57606a' },
    ]);
  });

  it('looks a preset up by name', () => {
    expect(presetColor('blue')).toBe('#1f6feb');
    expect(presetColor('amber')).toBe('#f4a300');
  });

  it('keeps automatic text readable on every preset (WCAG AA, ≥ 4.5:1)', () => {
    for (const { color } of colorPresets()) {
      expect(contrastRatio(color, autoTextColor(color))).toBeGreaterThanOrEqual(4.5);
    }
  });
});
