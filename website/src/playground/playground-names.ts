import type { PresetName } from '@/core/model/presets';
import type { ElementEffectName, PageEffectName } from './playground-state';

// The extension's own names for presets and effects (public/_locales), as the options page shows
// them, so the playground teaches the words the extension uses.

export const PRESET_NAMES = {
  red: 'colorRed',
  amber: 'colorAmber',
  blue: 'colorBlue',
  slate: 'colorSlate',
} as const satisfies Record<PresetName, string>;

export const EFFECT_NAMES = {
  ribbon: 'effectRibbon',
  banner: 'effectBanner',
  frame: 'effectFrame',
  tint: 'effectTint',
  stripes: 'effectStripes',
  watermark: 'effectWatermark',
  titlePrefix: 'effectTitlePrefix',
  outline: 'effectOutline',
} as const satisfies Record<PageEffectName | ElementEffectName, string>;
