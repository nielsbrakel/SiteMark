// biome-ignore-all lint/security/noSecrets: i18n message keys, not secrets
import { useReducer } from 'react';
import { Field } from '@/ui/components/Field';
import type { IslandProps } from '../islands/island-props';
import { EffectPicker } from './EffectPicker';
import { PlacementFields } from './PlacementFields';
import styles from './Playground.module.css';
import { PlaygroundPreview } from './PlaygroundPreview';
import { PresetPicker } from './PresetPicker';
import {
  ELEMENT_EFFECTS,
  initialPlaygroundState,
  MARK_TEXT_MAX,
  PAGE_EFFECTS,
  type PlaygroundAction,
  type PlaygroundState,
  playgroundReducer,
} from './playground-state';

type ControlsProps = IslandProps & {
  readonly state: PlaygroundState;
  readonly dispatch: (action: PlaygroundAction) => void;
};

/** The custom color and the mark text, with the options page's error messages (REQ-PLAY-006). */
function TextFields({ t, state, dispatch }: ControlsProps) {
  const { hex, text } = state.errors;
  return (
    <>
      <Field label={t('optionsCustomColor')} {...(hex && { error: t(hex) })}>
        {(control) => (
          <input
            {...control}
            value={state.hexInput}
            spellCheck={false}
            onChange={(event) => dispatch({ type: 'hex', text: event.target.value })}
          />
        )}
      </Field>
      <Field label={t('websitePlaygroundText')} {...(text && { error: t(text) })}>
        {(control) => (
          <input
            {...control}
            value={state.textInput}
            maxLength={MARK_TEXT_MAX}
            onChange={(event) => dispatch({ type: 'text', text: event.target.value })}
          />
        )}
      </Field>
    </>
  );
}

function EffectFields({ t, state, dispatch }: ControlsProps) {
  return (
    <>
      <EffectPicker
        t={t}
        legend={t('websitePlaygroundPageEffects')}
        effects={PAGE_EFFECTS}
        on={state.pageEffects}
        onChange={(effect, on) => dispatch({ type: 'pageEffect', effect, on })}
      >
        <PlacementFields
          t={t}
          corner={state.corner}
          edge={state.edge}
          onCorner={(corner) => dispatch({ type: 'corner', corner })}
          onEdge={(edge) => dispatch({ type: 'edge', edge })}
        />
      </EffectPicker>
      <EffectPicker
        t={t}
        legend={t('websitePlaygroundElementEffects')}
        effects={ELEMENT_EFFECTS}
        on={state.elementEffects}
        onChange={(effect, on) => dispatch({ type: 'elementEffect', effect, on })}
      />
    </>
  );
}

/**
 * The playground (REQ-PLAY-001): labeled native controls next to the mock browser, where the
 * extension's own code draws the marks. Nothing is stored (REQ-PLAY-002).
 */
export function Playground({ t }: IslandProps) {
  const [state, dispatch] = useReducer(playgroundReducer, undefined, initialPlaygroundState);
  return (
    <div className={styles.playground}>
      <div className={styles.controls}>
        <PresetPicker
          t={t}
          value={state.preset}
          withCustom
          onChange={(preset) => dispatch({ type: 'preset', preset })}
        />
        <TextFields t={t} state={state} dispatch={dispatch} />
        <EffectFields t={t} state={state} dispatch={dispatch} />
      </div>
      <div className={styles.preview}>
        <PlaygroundPreview t={t} state={state} />
      </div>
    </div>
  );
}
