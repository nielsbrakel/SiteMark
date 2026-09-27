import type { ReactNode } from 'react';
import { t } from '@/lib/i18n/browser-source';
import { readBackups } from '@/platform/state-backups';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { commandErrorText } from './command-error';
import { downloadJson } from './download';
import type { Notify } from './notify';
import styles from './Pane.module.css';
import { sendTracked } from './save-status';

async function downloadBackup(): Promise<void> {
  const [newest] = await readBackups();
  if (newest) downloadJson('sitemark-backup', newest.raw);
}

/**
 * The recoverable error for unreadable data (REQ-DATA-001): download the backup the background
 * kept, or restore the defaults for good (a save replaces the unreadable data).
 */
export function UnreadableBanner({ notify }: { readonly notify: Notify }): ReactNode {
  const restore = async () => {
    const result = await sendTracked({ type: 'resetAll' });
    if (!result.ok) notify({ text: commandErrorText(result.error) });
  };
  return (
    <Card tone="danger" role="alert" className={styles.banner}>
      <p>{t('optionsUnreadable')}</p>
      <div className={styles.actions}>
        <Button onClick={() => void downloadBackup()}>{t('optionsDownloadBackup')}</Button>
        <Button onClick={() => void restore()}>{t('optionsRestoreDefaults')}</Button>
      </div>
    </Card>
  );
}
