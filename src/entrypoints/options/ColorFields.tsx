import { type ReactNode, useState } from 'react';
import { colorPresets, type PresetName } from '@/core/model/presets';
import type { Hex } from '@/core/model/schema';
import { type MessageKey, t } from '@/lib/i18n/browser-source';
import { ColorSwatches } from '@/ui/components/ColorSwatches';
import { HexField } from './HexField';
import styles from './MarkEditor.module.css';
import { useDebounced } from './use-debounced';

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
  // The native picker fires on every move while dragging; the color is saved once it stops moving.
  const [picked, setPicked] = useState<Hex>();
  const autosave = useDebounced(() => {
    if (picked !== undefined && picked !== color) void onSave(picked);
  });
  if (picked !== undefined && picked === color) setPicked(undefined);
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
          value={picked ?? color}
          onChange={(event) => {
            setPicked(event.target.value.toLowerCase() as Hex);
            autosave.schedule();
          }}
        />
      </div>
    </div>
  );
}
