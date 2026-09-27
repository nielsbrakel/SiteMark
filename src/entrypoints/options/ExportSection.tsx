import { type ReactNode, useId } from 'react';
import { browser } from 'wxt/browser';
import { buildExport, exportFilename } from '@/core/data/export';
import type { SiteMarkState } from '@/core/model/schema';
import { t } from '@/lib/i18n/browser-source';
import { Button } from '@/ui/components/Button';
import { downloadText } from './download';
import styles from './Pane.module.css';

function exportState(state: SiteMarkState): void {
  const now = new Date();
  const file = buildExport(state, {
    appVersion: browser.runtime.getManifest().version,
    now: now.getTime(),
  });
  const date = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
  downloadText(exportFilename(date), file.json);
}

/** Export (REQ-DATA-003): a local download of the site groups and settings, with a warning. */
export function ExportSection({ state }: { readonly state: SiteMarkState }): ReactNode {
  const headingId = useId();
  return (
    <section className={styles.pane} aria-labelledby={headingId}>
      <h3 id={headingId}>{t('optionsExportHeading')}</h3>
      <p>{t('optionsExportHelp')}</p>
      <p className="sm-well">{t('optionsExportWarning')}</p>
      <div>
        <Button onClick={() => exportState(state)}>{t('optionsExport')}</Button>
      </div>
    </section>
  );
}
