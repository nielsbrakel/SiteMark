import type { ReactNode } from 'react';
import { t } from '@/lib/i18n/browser-source';
import styles from './Layout.module.css';
import { useSaveStatus } from './save-status';

/**
 * A subtle "Saving…" / "Saved" (REQ-OPT-006). Only "Saved" is announced (politely): "Saving…" on
 * every pause in typing would be noise, and refusals are explained next to their field or in a toast.
 */
export function SaveStatusText(): ReactNode {
  const status = useSaveStatus();
  return (
    <p className={styles.saveStatus}>
      {status === 'saving' && <span aria-hidden="true">{t('optionsSaving')}</span>}
      <span aria-live="polite">{status === 'saved' ? t('optionsSaved') : ''}</span>
    </p>
  );
}
