import { type ReactNode, useId } from 'react';
import type { MarkId } from '@/core/ids';
import type { SiteGroup } from '@/core/model/schema';
import { t } from '@/lib/i18n/browser-source';
import { Button } from '@/ui/components/Button';
import { DeleteGroupButton } from './DeleteGroupButton';
import { DuplicateGroupButton } from './DuplicateGroupButton';
import { EnabledSwitch } from './EnabledSwitch';
import { exportSiteGroup } from './export-file';
import { MarkEditor } from './MarkEditor';
import { MarkList } from './MarkList';
import { NameField } from './NameField';
import type { Notify } from './notify';
import styles from './Pane.module.css';
import { PatternEditor } from './PatternEditor';
import { useOfferRevoke } from './revoke-prompt';

export type GroupEditorProps = {
  readonly group: SiteGroup;
  /** The group's place in the list (priority, REQ-GRP-004). */
  readonly index: number;
  readonly notify: Notify;
  /** Opens the group a command added at the bottom (a duplicate). */
  readonly onAdded: (revision: number) => void;
  /** The mark whose editor is open (`#/groups/:id/marks/:markId`). */
  readonly markId?: MarkId | undefined;
};

/** The editor pane for one site group (REQ-OPT-002). */
export function GroupEditor({
  group,
  index,
  notify,
  onAdded,
  markId,
}: GroupEditorProps): ReactNode {
  const id = useId();
  const offerRevoke = useOfferRevoke();
  const mark = group.marks.find((candidate) => candidate.id === markId);
  return (
    <section className={styles.pane} aria-labelledby={id}>
      <h2 id={id}>{group.name}</h2>
      <EnabledSwitch group={group} notify={notify} />
      <NameField group={group} />
      <PatternEditor group={group} notify={notify} />
      <MarkList group={group} notify={notify}>
        {mark && <MarkEditor key={mark.id} group={group} mark={mark} notify={notify} />}
      </MarkList>
      <div className={styles.actions}>
        <DuplicateGroupButton group={group} notify={notify} onAdded={onAdded} />
        <Button onClick={() => exportSiteGroup(group)}>{t('optionsExportGroup')}</Button>
        <DeleteGroupButton
          group={group}
          index={index}
          notify={notify}
          onUndoWindowPassed={offerRevoke}
        />
      </div>
    </section>
  );
}
