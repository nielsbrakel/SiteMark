import type { ReactNode } from 'react';
import { t } from '@/lib/i18n/browser-source';
import { Card } from '@/ui/components/Card';
import { Actions } from './Actions';
import styles from './CantRun.module.css';

export type CantRunProps = { readonly tabId: number };

/** "SiteMark can't run on this page", with the actions disabled (REQ-POP-005, design.md §5.1 D). */
export function CantRun({ tabId }: CantRunProps): ReactNode {
  return (
    <>
      <Card className={styles.card}>
        <p className={styles.title}>{t('popupCantRun')}</p>
        <p className={styles.reason}>{t('popupCantRunReason')}</p>
      </Card>
      <Actions tabId={tabId} status={undefined} />
    </>
  );
}
