import { type ReactNode, useId } from 'react';
import type { SiteGroup } from '@/core/model/schema';
import { t } from '@/lib/i18n/browser-source';
import { AddPatternForm } from './AddPatternForm';
import type { Notify } from './notify';
import styles from './PatternEditor.module.css';
import { PatternList } from './PatternList';
import { LIST_TEXT } from './pattern-lists';
import type { AddPattern } from './use-add-pattern';

export type PatternSectionProps = {
  readonly group: SiteGroup;
  /** The Add form's state; its `list` says which list this section edits. */
  readonly form: AddPattern;
  readonly notify: Notify;
  /** Shown under the heading, e.g. what excludes do. */
  readonly intro?: ReactNode;
  /** Shown after the Add form, e.g. the URL tester. */
  readonly children?: ReactNode;
};

/** One of a site group's pattern lists with its Add form (REQ-OPT-002, REQ-URL-008). */
export function PatternSection({
  group,
  form,
  notify,
  intro,
  children,
}: PatternSectionProps): ReactNode {
  const headingId = useId();
  return (
    <section className={styles.editor} aria-labelledby={headingId}>
      <h3 id={headingId}>{t(LIST_TEXT[form.list].heading)}</h3>
      {intro}
      <PatternList group={group} list={form.list} labelledBy={headingId} notify={notify} />
      <AddPatternForm form={form} />
      {children}
    </section>
  );
}
