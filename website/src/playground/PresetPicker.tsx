// biome-ignore-all lint/security/noSecrets: i18n message keys, not secrets
import { useId } from 'react';
import { colorPresets, type PresetName } from '@/core/model/presets';
import { paintColor } from '@/ui/components/paint';
import type { IslandProps } from '../islands/island-props';
import styles from './Playground.module.css';
import type { PlaygroundPreset } from './playground-state';

const NAMES = {
  red: 'colorRed',
  amber: 'colorAmber',
  blue: 'colorBlue',
  slate: 'colorSlate',
} as const satisfies Record<PresetName, string>;

type Props = IslandProps & {
  readonly value: PlaygroundPreset;
  readonly onChange: (preset: PlaygroundPreset) => void;
  /** Adds the Custom choice (the playground page; the home hero has the four presets only). */
  readonly withCustom?: boolean;
};

/**
 * The color presets as native radio buttons, each with its name next to its swatch, so the choice
 * never relies on color alone (REQ-PLAY-005).
 */
export function PresetPicker({ t, value, onChange, withCustom = false }: Props) {
  const name = useId();
  const presets: { preset: PlaygroundPreset; label: string; color?: string }[] = [
    ...colorPresets().map(({ name: preset, color }) => ({
      preset,
      label: t(NAMES[preset]),
      color,
    })),
    ...(withCustom ? [{ preset: 'custom' as const, label: t('websitePlaygroundCustom') }] : []),
  ];
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>{t('optionsColor')}</legend>
      <div className={styles.presets}>
        {presets.map(({ preset, label, color }) => (
          <label key={preset} className={styles.preset}>
            <input
              type="radio"
              name={name}
              value={preset}
              checked={value === preset}
              onChange={() => onChange(preset)}
            />
            <span
              className={styles.swatch}
              data-custom={color === undefined}
              ref={(swatch) => paintColor(swatch, '--sm-preset-color', color ?? '')}
              aria-hidden="true"
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
