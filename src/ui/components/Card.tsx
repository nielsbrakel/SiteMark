import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Card.module.css';
import { classNames } from './class-names';

export type CardTone = 'neutral' | 'warning' | 'danger';

export type CardProps = Omit<HTMLAttributes<HTMLElement>, 'style'> & {
  readonly as?: 'div' | 'section' | 'article' | 'aside';
  /** `warning`/`danger` add a status-colored boundary (the content still says what is wrong). */
  readonly tone?: CardTone;
};

/** A raised surface with a 20 px radius (design.md §4). */
export function Card({
  as: Element = 'div',
  tone = 'neutral',
  className,
  ...rest
}: CardProps): ReactNode {
  return <Element {...rest} data-tone={tone} className={classNames(styles.card, className)} />;
}
