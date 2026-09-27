import { type ReactNode, useId } from 'react';
import type { SiteMarkState } from '@/core/model/schema';
import { t } from '@/lib/i18n/browser-source';
import { ExportSection } from './ExportSection';
import { ImportSection } from './ImportSection';
import type { Notify } from './notify';
import styles from './Pane.module.css';
import { ResetSection } from './ResetSection';

/** Data (REQ-OPT-005): export, import and reset. */
export function DataPane({
  state,
  notify,
}: {
  readonly state: SiteMarkState;
  readonly notify: Notify;
}): ReactNode {
  const titleId = useId();
  return (
    <section className={styles.pane} aria-labelledby={titleId}>
      <h2 id={titleId}>{t('optionsData')}</h2>
      <ExportSection state={state} />
      <ImportSection />
      <ResetSection notify={notify} />
    </section>
  );
}
