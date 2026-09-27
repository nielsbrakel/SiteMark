import type { ReactNode } from 'react';
import { colorPresets, type PresetName } from '@/core/model/presets';
import type { Hex } from '@/core/model/schema';
import { type MessageKey, t } from '@/lib/i18n/browser-source';
import { ColorSwatches } from '@/ui/components/ColorSwatches';
import { HexField } from './HexField';
import styles from './MarkEditor.module.css';

const PRESET_NAMES: Readonly<Record<PresetName, MessageKey>> = {
  red: 'colorRed',
  amber: 'colorAmber',
  blue: 'colorBlue',
  slate: 'colorSlate',
};

export type ColorFieldsProps = {
  readonly color: Hex;
  /** Saves the mark's color; returns the refusal text, if any. */
  readonly onSave: (color: Hex) => Promise<string | undefined>;
};

/** The mark color (REQ-MARK-012): four presets, a custom hex value and the native picker. */
export function ColorFields({ color, onSave }: ColorFieldsProps): ReactNode {
  const options = colorPresets().map((preset) => ({
    value: preset.color,
    label: t(PRESET_NAMES[preset.name]),
  }));
  return (
    <div className={styles.colors}>
      <ColorSwatches
        label={t('optionsColor')}
        options={options}
        value={color}
        onChange={(preset) => void onSave(preset)}
      />
      <div className={styles.custom}>
        <HexField label={t('optionsCustomColor')} value={color} onSave={onSave} />
        <input
          type="color"
          aria-label={t('optionsPickColor')}
          className={styles.picker}
          value={color}
          onChange={(event) => void onSave(event.target.value.toLowerCase() as Hex)}
        />
      </div>
    </div>
  );
}
