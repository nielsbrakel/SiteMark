import { type ReactNode, useId } from 'react';
import styles from './Pane.module.css';

/** A page of the options app that only has its title so far (Settings: T-137, Data: T-138). */
export function PlaceholderPane({ title }: { readonly title: string }): ReactNode {
  const id = useId();
  return (
    <section className={styles.pane} aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
    </section>
  );
}
