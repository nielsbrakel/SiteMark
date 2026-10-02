import type { ReactNode } from 'react';
import type { ElementEffects, PageEffects } from '@/core/model/schema';
import { Switch } from '../Switch';
import { EffectSettings } from './EffectSettings';
import {
  defaultEffect,
  EFFECT_NAMES,
  EFFECTS_BY_TARGET,
  type EffectName,
  type TargetKind,
} from './effect-catalog';
import styles from './MarkForm.module.css';
import { useT } from './translate';

type Effects = PageEffects & ElementEffects;

export type EffectsFieldsetProps = {
  readonly target: TargetKind;
  readonly effects: PageEffects | ElementEffects;
  readonly groupName: string;
  /** Saves the mark's new effects. */
  readonly onSave: (effects: PageEffects | ElementEffects) => void;
};

/**
 * The effect switches with their settings (REQ-OPT-003): only the effects of the mark's target
 * (REQ-MARK-014), and the last effect can't be turned off (REQ-MARK-001), with a hint that says why.
 */
export function EffectsFieldset({
  target,
  effects,
  groupName,
  onSave,
}: EffectsFieldsetProps): ReactNode {
  const t = useT();
  const current: Partial<Record<EffectName, unknown>> = effects;
  const onCount = EFFECTS_BY_TARGET[target].filter((name) => current[name] !== undefined).length;
  const set = (name: EffectName, value: unknown) => {
    const { [name]: _old, ...rest } = current;
    onSave((value === undefined ? rest : { ...rest, [name]: value }) as Effects);
  };
  return (
    <fieldset className={styles.effects}>
      <legend>{t('optionsEffects')}</legend>
      {EFFECTS_BY_TARGET[target].map((name) => {
        const isOn = current[name] !== undefined;
        const isLast = isOn && onCount === 1;
        return (
          <div key={name} className={styles.effect}>
            <Switch
              label={t(EFFECT_NAMES[name])}
              checked={isOn}
              disabled={isLast}
              {...(isLast && { description: t('optionsLastEffectHint') })}
              onChange={() => set(name, isOn ? undefined : defaultEffect(name, target, groupName))}
            />
            {isOn && (
              <EffectSettings
                name={name}
                effects={effects as Effects}
                target={target}
                set={(value) => set(name, value)}
              />
            )}
          </div>
        );
      })}
    </fieldset>
  );
}
