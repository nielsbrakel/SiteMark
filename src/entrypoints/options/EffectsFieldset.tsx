import { type ReactNode, useId } from 'react';
import type { ElementEffects, PageEffects } from '@/core/model/schema';
import { t } from '@/lib/i18n/browser-source';
import { EffectSettings } from './EffectSettings';
import {
  defaultEffect,
  EFFECTS_BY_TARGET,
  type EffectName,
  type TargetKind,
} from './effect-catalog';
import styles from './MarkEditor.module.css';
import { EFFECT_NAMES } from './mark-summary';

type Effects = PageEffects & ElementEffects;

export type EffectsFieldsetProps = {
  readonly target: TargetKind;
  readonly effects: PageEffects | ElementEffects;
  readonly groupName: string;
  /** Saves the mark's new effects. */
  readonly onSave: (effects: PageEffects | ElementEffects) => void;
};

/**
 * The effect toggles with their settings (REQ-OPT-003): only the effects of the mark's target
 * (REQ-MARK-014), and the last effect can't be turned off (REQ-MARK-001), with a hint that says why.
 */
export function EffectsFieldset({
  target,
  effects,
  groupName,
  onSave,
}: EffectsFieldsetProps): ReactNode {
  const hintId = useId();
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
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={isOn}
                disabled={isLast}
                aria-describedby={isLast ? hintId : undefined}
                onChange={() =>
                  set(name, isOn ? undefined : defaultEffect(name, target, groupName))
                }
              />
              {t(EFFECT_NAMES[name])}
            </label>
            {isLast && (
              <p id={hintId} className={styles.hint}>
                {t('optionsLastEffectHint')}
              </p>
            )}
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
