import { colorPresets, type PresetName } from '@/core/model/presets';
import type { MarkFormKey } from './mark-form-keys';
import type { Translate } from './translate';

export const PRESET_NAMES = {
  red: 'colorRed',
  amber: 'colorAmber',
  blue: 'colorBlue',
  slate: 'colorSlate',
} as const satisfies Record<PresetName, MarkFormKey>;

/** The four color presets as swatch options (value: the hex color), named in the page's language. */
export function presetOptions(t: Translate) {
  return colorPresets().map(({ name, color }) => ({ value: color, label: t(PRESET_NAMES[name]) }));
}
