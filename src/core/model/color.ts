import { notImplemented } from '../not-implemented';
import type { Hex, MarkBase } from './schema';

/** WCAG 2 contrast ratio between two colors, from 1 (same) to 21 (black on white). */
export function contrastRatio(_a: Hex, _b: Hex): number {
  return notImplemented();
}

/** Black or white, whichever has the higher contrast against `color` (REQ-MARK-011). */
export function autoTextColor(_color: Hex): Hex {
  return notImplemented();
}

/** The text color a mark renders with: its own, or the automatic one for `auto`. */
export function resolveTextColor(_mark: Pick<MarkBase, 'color' | 'textColor'>): Hex {
  return notImplemented();
}
