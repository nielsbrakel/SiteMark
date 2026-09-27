import type { ReactNode } from 'react';
import { t } from '@/lib/i18n/browser-source';
import styles from './Layout.module.css';
import { useSaveStatus } from './save-status';

/** A subtle, politely announced "Saving…" / "Saved" (REQ-OPT-006). */
export function SaveStatusText(): ReactNode {
  const status = useSaveStatus();
  const text = { idle: '', saving: t('optionsSaving'), saved: t('optionsSaved') }[status];
  return (
    <p aria-live="polite" className={styles.saveStatus}>
      {text}
    </p>
  );
}
