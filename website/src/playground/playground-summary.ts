// biome-ignore-all lint/security/noSecrets: i18n message keys, not secrets
import { colorPresets } from '@/core/model/presets';
import { EFFECT_NAMES, type EffectName } from '@/ui/components/mark-form/effect-catalog';
import { PRESET_NAMES } from '@/ui/components/mark-form/preset-options';
import type { WebsiteTranslator } from '../i18n/website-t';
import type { PlaygroundState } from './playground-state';

type T = WebsiteTranslator['t'];

const names = (t: T, effects: object) =>
  (Object.keys(effects) as EffectName[])
    .map((effect) => t(EFFECT_NAMES[effect]).toLocaleLowerCase())
    .join(', ');

/**
 * What the preview shows, in words (REQ-PLAY-005): the marks are drawn in a shadow root and are
 * decorative, so a status line tells assistive technology what changed.
 */
export function playgroundSummary(
  { enabled, color, pageEffects, elementEffects }: PlaygroundState,
  t: T,
) {
  if (!enabled) return t('websitePlaygroundSummaryOff');
  const preset = colorPresets().find((candidate) => candidate.color === color);
  const colorName = preset ? t(PRESET_NAMES[preset.name]) : color;
  const page = t('websitePlaygroundSummaryPage', [
    names(t, pageEffects),
    colorName.toLocaleLowerCase(),
  ]);
  const element = elementEffects
    ? t('websitePlaygroundSummaryElement', [names(t, elementEffects)])
    : '';
  return [page, element].filter(Boolean).join(' ');
}
