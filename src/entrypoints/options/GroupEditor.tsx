import { type ReactNode, useId } from 'react';
import type { SiteGroup } from '@/core/model/schema';
import { DeleteGroupButton } from './DeleteGroupButton';
import { DuplicateGroupButton } from './DuplicateGroupButton';
import { EnabledSwitch } from './EnabledSwitch';
import { NameField } from './NameField';
import type { Notify } from './notify';
import styles from './Pane.module.css';
import { PatternEditor } from './PatternEditor';

export type GroupEditorProps = {
  readonly group: SiteGroup;
  /** The group's place in the list (priority, REQ-GRP-004). */
  readonly index: number;
  readonly notify: Notify;
  /** Opens the group a command added at the bottom (a duplicate). */
  readonly onAdded: (revision: number) => void;
};

/** The editor pane for one site group (REQ-OPT-002). */
export function GroupEditor({ group, index, notify, onAdded }: GroupEditorProps): ReactNode {
  const id = useId();
  return (
    <section className={styles.pane} aria-labelledby={id}>
      <h2 id={id}>{group.name}</h2>
      <EnabledSwitch group={group} notify={notify} />
      <NameField group={group} />
      <PatternEditor group={group} notify={notify} />
      <div className={styles.actions}>
        <DuplicateGroupButton group={group} notify={notify} onAdded={onAdded} />
        <DeleteGroupButton group={group} index={index} notify={notify} />
      </div>
    </section>
  );
}
