import type { ElementEffects, PageEffects } from '@/core/model/schema';
import { assertNever } from '@/core/result';
import { nameRibbon, nameText } from './mark-drafts';

// The effects each target can have, in editor order, and what a newly turned-on effect starts as
// (REQ-MARK-014: page-only and element-only effects are kept apart by type).

export type EffectName = keyof PageEffects | keyof ElementEffects;
export type TargetKind = 'page' | 'element';

export const EFFECTS_BY_TARGET: Readonly<Record<TargetKind, readonly EffectName[]>> = {
  page: ['ribbon', 'banner', 'frame', 'tint', 'stripes', 'watermark', 'titlePrefix', 'favicon'],
  element: ['ribbon', 'outline', 'tint', 'stripes'],
};

/** Opacity and width ranges (spec §7); tint differs per target. */
export const RANGES = {
  frame: [2, 16],
  outline: [1, 8],
  tint: { page: [3, 15], element: [5, 40] },
  stripes: [5, 40],
  watermark: [4, 12],
} as const;

/** An effect as it starts when turned on; texts start as the site group's name. */
export function defaultEffect(name: EffectName, target: TargetKind, groupName: string): unknown {
  switch (name) {
    case 'ribbon':
      return nameRibbon(groupName);
    case 'banner':
      return { text: nameText(groupName, 60), edge: 'top', size: 'compact' };
    case 'frame':
      return { widthPx: 4 };
    case 'tint':
      return { opacityPct: target === 'page' ? 8 : 20 };
    case 'stripes':
      return target === 'page' ? { opacityPct: 20, area: 'edge' } : { opacityPct: 20 };
    case 'watermark':
      return { text: nameText(groupName, 24), opacityPct: 6 };
    case 'titlePrefix':
      return { text: nameText(groupName, 16) };
    case 'favicon':
      return {};
    case 'outline':
      return { widthPx: 2, style: 'solid', pulse: false };
    default:
      return assertNever(name);
  }
}
