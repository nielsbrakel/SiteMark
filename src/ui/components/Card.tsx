import type { HTMLAttributes, ReactNode } from 'react';
import { notImplemented } from '../../core/not-implemented';

export type CardTone = 'neutral' | 'warning' | 'danger';

export type CardProps = Omit<HTMLAttributes<HTMLElement>, 'style'> & {
  readonly as?: 'div' | 'section' | 'article' | 'aside';
  /** `warning`/`danger` add a status-colored boundary (the content still says what is wrong). */
  readonly tone?: CardTone;
};

export function Card(_props: CardProps): ReactNode {
  return notImplemented();
}
