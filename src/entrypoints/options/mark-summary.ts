import type { Mark } from '@/core/model/schema';
import { type MessageKey, t } from '@/lib/i18n/browser-source';
import type { EffectName } from './effect-catalog';

/** Effect names in the order the editor shows them. */
export const EFFECT_NAMES: Readonly<Record<EffectName, MessageKey>> = {
  ribbon: 'effectRibbon',
  banner: 'effectBanner',
  frame: 'effectFrame',
  outline: 'effectOutline',
  tint: 'effectTint',
  stripes: 'effectStripes',
  watermark: 'effectWatermark',
  titlePrefix: 'effectTitlePrefix',
  favicon: 'effectFavicon',
};

/** The effects a mark has, translated, in display order. */
function effectNames(mark: Mark): string {
  const effects: Partial<Record<EffectName, unknown>> = mark.effects;
  return (Object.keys(EFFECT_NAMES) as EffectName[])
    .filter((name) => effects[name] !== undefined)
    .map((name) => t(EFFECT_NAMES[name]))
    .join(', ');
}

/** One line for a mark in lists (REQ-OPT-003): `label · Element · #app · Outline, Ribbon`. */
export function markSummary(mark: Mark): string {
  const target =
    mark.target.kind === 'page'
      ? [t('optionsTargetPage')]
      : [t('optionsTargetElement'), mark.target.selector];
  return [...(mark.label ? [mark.label] : []), ...target, effectNames(mark)].join(' · ');
}
