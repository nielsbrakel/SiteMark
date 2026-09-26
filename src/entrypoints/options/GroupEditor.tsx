import { type ReactNode, useId } from 'react';
import type { SiteGroup } from '@/core/model/schema';
import styles from './Pane.module.css';

export type GroupEditorProps = {
  readonly group: SiteGroup;
};

/** The editor pane for one site group (REQ-OPT-002). */
export function GroupEditor({ group }: GroupEditorProps): ReactNode {
  const id = useId();
  return (
    <section className={styles.pane} aria-labelledby={id}>
      <h2 id={id}>{group.name}</h2>
    </section>
  );
}
