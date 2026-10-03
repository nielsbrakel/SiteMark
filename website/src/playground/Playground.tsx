// biome-ignore-all lint/security/noSecrets: i18n message keys, not secrets
import { useState } from 'react';
import { ColorFields } from '@/ui/components/mark-form/ColorFields';
import { EffectsFieldset } from '@/ui/components/mark-form/EffectsFieldset';
import { TextColorField } from '@/ui/components/mark-form/TextColorField';
import { TranslateContext } from '@/ui/components/mark-form/translate';
import { Switch } from '@/ui/components/Switch';
import type { IslandProps } from '../islands/island-props';
import styles from './Playground.module.css';
import { PlaygroundPreview } from './PlaygroundPreview';
import {
  DEFAULT_ELEMENT_EFFECTS,
  initialPlaygroundState,
  PLAYGROUND_NAME,
  type PlaygroundState,
} from './playground-state';

/**
 * The playground (REQ-PLAY-001): the options page's own mark form, for a page mark and an optional
 * mark on the sample button, next to the mock browser where the extension's own code draws the
 * marks. Nothing is stored (REQ-PLAY-002).
 */
export function Playground({ t }: IslandProps) {
  const [state, setState] = useState(initialPlaygroundState);
  const change = async (next: Partial<PlaygroundState>): Promise<undefined> => {
    setState((current) => ({ ...current, ...next }));
  };
  return (
    <TranslateContext value={t}>
      <div className={styles.playground}>
        <div className={styles.controls}>
          <ColorFields color={state.color} onSave={async (color) => change({ color })} />
          <TextColorField
            color={state.color}
            textColor={state.textColor}
            onSave={async (textColor) => change({ textColor })}
          />
          <EffectsFieldset
            target="page"
            effects={state.pageEffects}
            groupName={PLAYGROUND_NAME}
            onSave={(pageEffects) => void change({ pageEffects })}
          />
          <Switch
            label={t('websitePlaygroundElementMark')}
            checked={Boolean(state.elementEffects)}
            onChange={(on) =>
              void change({ elementEffects: on ? DEFAULT_ELEMENT_EFFECTS : undefined })
            }
          />
          {state.elementEffects && (
            <EffectsFieldset
              target="element"
              effects={state.elementEffects}
              groupName={PLAYGROUND_NAME}
              onSave={(elementEffects) => void change({ elementEffects })}
            />
          )}
        </div>
        <div className={styles.preview}>
          <Switch
            label={t('websitePlaygroundSwitch')}
            checked={state.enabled}
            onChange={(enabled) => void change({ enabled })}
            className={styles.master}
          />
          <PlaygroundPreview t={t} state={state} />
        </div>
      </div>
    </TranslateContext>
  );
}
