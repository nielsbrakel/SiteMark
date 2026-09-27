import type { ReactNode } from 'react';
import { t } from '@/lib/i18n/browser-source';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { browserStateSource } from '@/ui/hooks/state-source';
import { downloadJson } from './download';
import styles from './Pane.module.css';

async function downloadCopy(): Promise<void> {
  downloadJson('sitemark-data', await browserStateSource.readStored());
}

/**
 * Data from a newer SiteMark (REQ-DATA-007): the page opens read-only and says why; the data can
 * be downloaded as it is, and is never changed.
 */
export function ReadOnlyBanner({ schemaVersion }: { readonly schemaVersion: number }): ReactNode {
  return (
    <Card tone="warning" role="alert" className={styles.banner}>
      <p>{t('optionsReadOnly', String(schemaVersion))}</p>
      <div className={styles.actions}>
        <Button onClick={() => void downloadCopy()}>{t('optionsDownloadCopy')}</Button>
      </div>
    </Card>
  );
}
