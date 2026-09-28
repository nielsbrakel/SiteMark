import type { ReactNode } from 'react';
import type { IslandProps } from '../islands/island-props';
import styles from './Playground.module.css';
import { EFFECT_NAMES } from './playground-names';
import type { ElementEffectName, PageEffectName } from './playground-state';

type EffectName = PageEffectName | ElementEffectName;

type Props<E extends EffectName> = IslandProps & {
  readonly legend: string;
  readonly effects: readonly E[];
  readonly on: readonly E[];
  readonly onChange: (effect: E, on: boolean) => void;
  /** Settings shown under the checkboxes (the ribbon corner, the banner edge). */
  readonly children?: ReactNode;
};

/** A group of native checkboxes, one per effect (REQ-PLAY-001, REQ-PLAY-005). */
export function EffectPicker<E extends EffectName>({
  t,
  legend,
  effects,
  on,
  onChange,
  children,
}: Props<E>) {
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.effects}>
        {effects.map((effect) => (
          <label key={effect} className={styles.effect}>
            <input
              type="checkbox"
              checked={on.includes(effect)}
              onChange={(event) => onChange(effect, event.target.checked)}
            />
            {t(EFFECT_NAMES[effect])}
          </label>
        ))}
      </div>
      {children}
    </fieldset>
  );
}
