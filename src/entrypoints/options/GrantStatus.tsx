import type { ReactNode } from 'react';
import type { OriginPattern } from '@/core/url/origin';
import { t } from '@/lib/i18n/browser-source';
import { requestOrigins } from '@/platform/permissions';
import { Button } from '@/ui/components/Button';
import { CheckIcon, WarningIcon } from '@/ui/components/icons';
import styles from './PatternEditor.module.css';
import { useGranted } from './use-granted';

/**
 * A pattern's grant (REQ-PRIV-002): Granted, or Not granted with Allow, which prompts first and
 * synchronously in the click (D-229). The status follows the browser live.
 */
export function GrantStatus({
  origins,
}: {
  readonly origins: readonly OriginPattern[];
}): ReactNode {
  const granted = useGranted(origins);
  if (granted === undefined) return null;
  if (granted) {
    return (
      <span className={styles.granted}>
        <CheckIcon />
        {t('optionsGranted')}
      </span>
    );
  }
  return (
    <span className={styles.notGranted}>
      <WarningIcon />
      {t('optionsNotGranted')}
      <Button variant="quiet" onClick={() => void requestOrigins(origins)}>
        {t('optionsAllow')}
      </Button>
    </span>
  );
}
