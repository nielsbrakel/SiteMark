import { useId } from 'react';
import type { Corner } from '@/core/model/schema';
import type { IslandProps } from '../islands/island-props';
import styles from './Playground.module.css';

const CORNERS = [
  ['top-left', 'cornerTopLeft'],
  ['top-right', 'cornerTopRight'],
  ['bottom-left', 'cornerBottomLeft'],
  ['bottom-right', 'cornerBottomRight'],
] as const;

type Props = IslandProps & {
  readonly corner: Corner;
  readonly onCorner: (corner: Corner) => void;
};

/** Where the ribbon goes: a select with the options page's labels. */
export function PlacementFields({ t, corner, onCorner }: Props) {
  const cornerId = useId();
  return (
    <div className={styles.placement}>
      <label htmlFor={cornerId}>{t('optionsRibbonCorner')}</label>
      <select
        id={cornerId}
        className={styles.select}
        value={corner}
        onChange={(event) => onCorner(event.target.value as Corner)}
      >
        {CORNERS.map(([value, label]) => (
          <option key={value} value={value}>
            {t(label)}
          </option>
        ))}
      </select>
    </div>
  );
}
