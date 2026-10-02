import { type ReactNode, useState } from 'react';
import type { Hex } from '@/core/model/schema';
import { ColorSwatches } from '../ColorSwatches';
import { HexField } from './HexField';
import styles from './MarkForm.module.css';
import { presetOptions } from './preset-options';
import { useT } from './translate';
import { useDebounced } from './use-debounced';

export type ColorFieldsProps = {
  readonly color: Hex;
  /** Saves the mark's color; returns the refusal text, if any. */
  readonly onSave: (color: Hex) => Promise<string | undefined>;
};

/** The mark color (REQ-MARK-012): four presets, a custom hex value and the native picker. */
export function ColorFields({ color, onSave }: ColorFieldsProps): ReactNode {
  const t = useT();
  // The native picker fires on every move while dragging; the color is saved once it stops moving.
  const [picked, setPicked] = useState<Hex>();
  const autosave = useDebounced(() => {
    if (picked !== undefined && picked !== color) void onSave(picked);
  });
  if (picked !== undefined && picked === color) setPicked(undefined);
  return (
    <div className={styles.colors}>
      <ColorSwatches
        label={t('optionsColor')}
        options={presetOptions(t)}
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
