import { type ReactNode, useId } from 'react';
import type { SiteGroup } from '@/core/model/schema';
import { t } from '@/lib/i18n/browser-source';
import { AddPatternForm } from './AddPatternForm';
import type { Notify } from './notify';
import styles from './PatternEditor.module.css';
import { PatternList } from './PatternList';

/** The URL patterns of a site group: the list and the Add form (REQ-OPT-002). */
export function PatternEditor({
  group,
  notify,
}: {
  readonly group: SiteGroup;
  readonly notify: Notify;
}): ReactNode {
  const headingId = useId();
  return (
    <section className={styles.editor} aria-labelledby={headingId}>
      <h3 id={headingId}>{t('optionsPatterns')}</h3>
      <PatternList group={group} labelledBy={headingId} notify={notify} />
      <AddPatternForm groupId={group.id} />
    </section>
  );
}
