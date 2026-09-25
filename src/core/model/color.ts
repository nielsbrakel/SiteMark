import type { Hex, MarkBase } from './schema';

const BLACK = '#000000' as Hex;
const WHITE = '#ffffff' as Hex;

/** sRGB channel (0..255) → linear light. */
function linear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** WCAG 2 relative luminance of `#rrggbb`. */
function luminance(color: Hex): number {
  const channel = (offset: number) => linear(Number.parseInt(color.slice(offset, offset + 2), 16));
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

/** WCAG 2 contrast ratio between two colors, from 1 (same) to 21 (black on white). */
export function contrastRatio(a: Hex, b: Hex): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

/** Black or white, whichever has the higher contrast against `color` (REQ-MARK-011). */
export function autoTextColor(color: Hex): Hex {
  return contrastRatio(color, BLACK) >= contrastRatio(color, WHITE) ? BLACK : WHITE;
}

/** The text color a mark renders with: its own, or the automatic one for `auto`. */
export function resolveTextColor(mark: Pick<MarkBase, 'color' | 'textColor'>): Hex {
  return mark.textColor === 'auto' ? autoTextColor(mark.color) : mark.textColor;
}
