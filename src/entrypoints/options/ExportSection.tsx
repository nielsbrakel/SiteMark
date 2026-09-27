import { type ReactNode, useId } from 'react';
import type { SiteMarkState } from '@/core/model/schema';
import { t } from '@/lib/i18n/browser-source';
import { Button } from '@/ui/components/Button';
import { exportAll } from './export-file';
import styles from './Pane.module.css';

/** Export (REQ-DATA-003): a local download of the site groups and settings, with a warning. */
export function ExportSection({ state }: { readonly state: SiteMarkState }): ReactNode {
  const headingId = useId();
  return (
    <section className={styles.pane} aria-labelledby={headingId}>
      <h3 id={headingId}>{t('optionsExportHeading')}</h3>
      <p>{t('optionsExportHelp')}</p>
      <p className="sm-well">{t('optionsExportWarning')}</p>
      <div>
        <Button onClick={() => exportAll(state)}>{t('optionsExport')}</Button>
      </div>
    </section>
  );
}
