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

const EDGES = [
  ['top', 'edgeTop'],
  ['bottom', 'edgeBottom'],
] as const;

type Props = IslandProps & {
  readonly corner: Corner;
  readonly edge: 'top' | 'bottom';
  readonly onCorner: (corner: Corner) => void;
  readonly onEdge: (edge: 'top' | 'bottom') => void;
};

/** Where the ribbon and the banner go: native selects with the options page's labels. */
export function PlacementFields({ t, corner, edge, onCorner, onEdge }: Props) {
  const cornerId = useId();
  const edgeId = useId();
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
      <label htmlFor={edgeId}>{t('optionsBannerEdge')}</label>
      <select
        id={edgeId}
        className={styles.select}
        value={edge}
        onChange={(event) => onEdge(event.target.value as 'top' | 'bottom')}
      >
        {EDGES.map(([value, label]) => (
          <option key={value} value={value}>
            {t(label)}
          </option>
        ))}
      </select>
    </div>
  );
}
