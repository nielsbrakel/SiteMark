import { useState } from 'react';
import type { Hex } from '@/core/model/schema';
import { ColorSwatches } from '@/ui/components/ColorSwatches';
import { presetOptions } from '@/ui/components/mark-form/preset-options';
import type { IslandProps } from '../islands/island-props';
import styles from './Playground.module.css';
import { PlaygroundPreview } from './PlaygroundPreview';
import { initialPlaygroundState } from './playground-state';

/**
 * The home hero (REQ-PLAY-004): the playground's preview with only the four color presets, built
 * from the same state and preview as the playground page.
 */
export function HeroPlayground({ t }: IslandProps) {
  const [state, setState] = useState(initialPlaygroundState);
  return (
    <div className={styles.hero}>
      <PlaygroundPreview t={t} state={state} />
      <ColorSwatches
        label={t('optionsColor')}
        options={presetOptions(t)}
        value={state.color}
        onChange={(color: Hex) => setState({ ...state, color })}
      />
    </div>
  );
}
