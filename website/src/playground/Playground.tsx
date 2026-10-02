// biome-ignore-all lint/security/noSecrets: i18n message keys, not secrets
import { useReducer } from 'react';
import { Field } from '@/ui/components/Field';
import type { IslandProps } from '../islands/island-props';
import { PlacementFields } from './PlacementFields';
import styles from './Playground.module.css';
import { PlaygroundPreview } from './PlaygroundPreview';
import { PresetPicker } from './PresetPicker';
import {
  initialPlaygroundState,
  MARK_TEXT_MAX,
  type PlaygroundAction,
  type PlaygroundState,
  playgroundReducer,
} from './playground-state';

type ControlsProps = IslandProps & {
  readonly state: PlaygroundState;
  readonly dispatch: (action: PlaygroundAction) => void;
};

/** The custom color, which only shows while Custom is chosen (REQ-PLAY-006). */
function CustomColorField({ t, state, dispatch }: ControlsProps) {
  if (state.preset !== 'custom') return null;
  const { hex } = state.errors;
  return (
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
  );
}

/** The mark text, with the options page's error message (REQ-PLAY-006). */
function TextField({ t, state, dispatch }: ControlsProps) {
  const { text } = state.errors;
  return (
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
  );
}

/**
 * The playground (REQ-PLAY-001): labeled controls for one ribbon next to the mock browser, where
 * the extension's own code draws it. Nothing is stored (REQ-PLAY-002).
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
        <CustomColorField t={t} state={state} dispatch={dispatch} />
        <TextField t={t} state={state} dispatch={dispatch} />
        <PlacementFields
          t={t}
          corner={state.corner}
          onCorner={(corner) => dispatch({ type: 'corner', corner })}
        />
      </div>
      <div className={styles.preview}>
        <PlaygroundPreview t={t} state={state} />
      </div>
    </div>
  );
}
