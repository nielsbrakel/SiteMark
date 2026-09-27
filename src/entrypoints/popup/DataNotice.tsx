import type { ReactNode } from 'react';
import { t } from '@/lib/i18n/browser-source';
import { optionsPageUrl } from '@/platform/deep-links';
import { Card } from '@/ui/components/Card';
import styles from './DataNotice.module.css';

export type DataProblem = 'readOnly' | 'unreadable';

const MESSAGES = {
  readOnly: 'errorStateReadOnly',
  unreadable: 'errorStateUnreadable',
} as const satisfies Record<DataProblem, string>;

/** A danger card about the stored data, linking to the data settings (REQ-DATA-007, §5.1 E). */
export function DataNotice({ problem }: { readonly problem: DataProblem }): ReactNode {
  return (
    <Card tone="danger" className={styles.notice}>
      <p className={styles.text}>{t(MESSAGES[problem])}</p>
      <a href={optionsPageUrl({ page: 'data' })} target="_blank" rel="noreferrer">
        {t('popupOpenSettings')}
      </a>
    </Card>
  );
}
