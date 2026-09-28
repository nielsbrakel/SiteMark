import { useReducer } from 'react';
import type { IslandProps } from '../islands/island-props';
import styles from './Playground.module.css';
import { PlaygroundPreview } from './PlaygroundPreview';
import { PresetPicker } from './PresetPicker';
import { initialPlaygroundState, playgroundReducer } from './playground-state';

/**
 * The home hero (REQ-PLAY-004): the playground's preview with only the four presets, built from
 * the same state, controls and preview as the playground page.
 */
export function HeroPlayground({ t }: IslandProps) {
  const [state, dispatch] = useReducer(playgroundReducer, undefined, initialPlaygroundState);
  return (
    <div className={styles.hero}>
      <PlaygroundPreview t={t} state={state} />
      <PresetPicker
        t={t}
        value={state.preset}
        onChange={(preset) => dispatch({ type: 'preset', preset })}
      />
    </div>
  );
}
