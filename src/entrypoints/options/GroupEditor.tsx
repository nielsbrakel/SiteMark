import { type ReactNode, useId } from 'react';
import type { SiteGroup } from '@/core/model/schema';
import { DeleteGroupButton } from './DeleteGroupButton';
import { NameField } from './NameField';
import type { Notify } from './notify';
import styles from './Pane.module.css';

export type GroupEditorProps = {
  readonly group: SiteGroup;
  /** The group's place in the list (priority, REQ-GRP-004). */
  readonly index: number;
  readonly notify: Notify;
};

/** The editor pane for one site group (REQ-OPT-002). */
export function GroupEditor({ group, index, notify }: GroupEditorProps): ReactNode {
  const id = useId();
  return (
    <section className={styles.pane} aria-labelledby={id}>
      <h2 id={id}>{group.name}</h2>
      <NameField group={group} />
      <div className={styles.actions}>
        <DeleteGroupButton group={group} index={index} notify={notify} />
      </div>
    </section>
  );
}
