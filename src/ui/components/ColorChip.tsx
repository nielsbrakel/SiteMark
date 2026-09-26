import type { ReactNode } from 'react';
import type { Hex } from '../../core/model/schema';
import styles from './ColorChip.module.css';
import { classNames } from './class-names';
import { paintColor } from './paint';

export type ColorChipProps = {
  readonly color: Hex;
  /** Names the color for assistive technology; without it the chip is decorative. */
  readonly label?: string;
  readonly className?: string;
};

/** A 12 px dot in a mark color with a control-border ring (design.md §4). */
export function ColorChip({ color, label, className }: ColorChipProps): ReactNode {
  const paint = (element: HTMLSpanElement | null) => paintColor(element, '--sm-chip-color', color);
  const classes = classNames(styles.chip, className);
  return label ? (
    <span ref={paint} role="img" aria-label={label} className={classes} />
  ) : (
    <span ref={paint} aria-hidden="true" className={classes} />
  );
}
