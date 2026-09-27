import { type ReactNode, useId } from 'react';
import type { SiteGroup } from '@/core/model/schema';
import { t } from '@/lib/i18n/browser-source';
import { AddPatternForm } from './AddPatternForm';
import type { Notify } from './notify';
import styles from './PatternEditor.module.css';
import { PatternList } from './PatternList';
import { UrlTester } from './UrlTester';
import { useAddPattern } from './use-add-pattern';

/** The URL patterns of a site group: the list, the Add form and the URL tester (REQ-OPT-002). */
export function PatternEditor({
  group,
  notify,
}: {
  readonly group: SiteGroup;
  readonly notify: Notify;
}): ReactNode {
  const headingId = useId();
  const form = useAddPattern(group.id);
  return (
    <section className={styles.editor} aria-labelledby={headingId}>
      <h3 id={headingId}>{t('optionsPatterns')}</h3>
      <PatternList group={group} labelledBy={headingId} notify={notify} />
      <AddPatternForm form={form} />
      <UrlTester patterns={group.patterns} draft={form.input} />
    </section>
  );
}
