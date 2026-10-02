import type { Mark } from '@/core/model/schema';
import { t } from '@/lib/i18n/browser-source';
import { EFFECT_NAMES, type EffectName } from '@/ui/components/mark-form/effect-catalog';

/** The effects a mark has, translated, in display order. */
function effectNames(mark: Mark): string {
  const effects: Partial<Record<EffectName, unknown>> = mark.effects;
  return (Object.keys(EFFECT_NAMES) as EffectName[])
    .filter((name) => effects[name] !== undefined)
    .map((name) => t(EFFECT_NAMES[name]))
    .join(', ');
}

/** Between the parts of a summary line. */
export const SEPARATOR = ' · ';

/** A piece of a mark's summary line. User text (label, selector) is never translated (REQ-I18N-003). */
type SummaryPart = { readonly text: string; readonly isUserText: boolean };

const userText = (text: string): SummaryPart => ({ text, isUserText: true });
const uiText = (text: string): SummaryPart => ({ text, isUserText: false });

/** The pieces of a mark's line in lists (REQ-OPT-003): label, target, selector, effects. */
export function markSummaryParts(mark: Mark): readonly SummaryPart[] {
  const target =
    mark.target.kind === 'page'
      ? [uiText(t('optionsTargetPage'))]
      : [uiText(t('optionsTargetElement')), userText(mark.target.selector)];
  return [...(mark.label ? [userText(mark.label)] : []), ...target, uiText(effectNames(mark))];
}

/** One line for a mark in lists (REQ-OPT-003): `label · Element · #app · Outline, Ribbon`. */
export function markSummary(mark: Mark): string {
  return markSummaryParts(mark)
    .map((part) => part.text)
    .join(SEPARATOR);
}
