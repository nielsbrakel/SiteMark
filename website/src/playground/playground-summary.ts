// biome-ignore-all lint/security/noSecrets: i18n message keys, not secrets
import type { WebsiteTranslator } from '../i18n/website-t';
import { EFFECT_NAMES, PRESET_NAMES } from './playground-names';
import type { PlaygroundState } from './playground-state';

type T = WebsiteTranslator['t'];

const names = (t: T, effects: readonly (keyof typeof EFFECT_NAMES)[]) =>
  effects.map((effect) => t(EFFECT_NAMES[effect]).toLocaleLowerCase()).join(', ');

/**
 * What the preview shows, in words (REQ-PLAY-005): the marks are drawn in a shadow root and the
 * ribbon is decorative, so a status line tells assistive technology what changed.
 */
export function playgroundSummary(state: PlaygroundState, t: T): string {
  const { pageEffects, elementEffects, preset, color, text } = state;
  if (!pageEffects.length && !elementEffects.length) return t('websitePlaygroundSummaryNone');
  const colorName = preset === 'custom' ? color : t(PRESET_NAMES[preset]).toLocaleLowerCase();
  const page = pageEffects.length
    ? t('websitePlaygroundSummaryPage', [names(t, pageEffects), colorName, text])
    : '';
  const element = elementEffects.length
    ? t('websitePlaygroundSummaryElement', [names(t, elementEffects)])
    : '';
  return [page, element].filter(Boolean).join(' ');
}
