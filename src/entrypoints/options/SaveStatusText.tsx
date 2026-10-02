import type { ReactNode } from 'react';
import { t } from '@/lib/i18n/browser-source';
import { useSaveStatus } from './save-status';

/**
 * Announces "Saved" politely, for assistive technology only (REQ-OPT-006): autosave needs no visible
 * status, and "Saving…" on every pause in typing would be noise. Refusals are explained next to
 * their field or in a toast.
 */
export function SaveStatusText(): ReactNode {
  const status = useSaveStatus();
  return (
    <p className="sm-visually-hidden" aria-live="polite">
      {status === 'saved' ? t('optionsSaved') : ''}
    </p>
  );
}
