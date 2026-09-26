import { type ReactNode, useId } from 'react';
import { t } from '@/lib/i18n/browser-source';
import { Button } from '@/ui/components/Button';
import styles from './NoMatch.module.css';

/** No site group matches the tab: offer Mark this site (REQ-POP-001, design.md §5.1 B). */
export function NoMatch(): ReactNode {
  const hintId = useId();
  // biome-ignore lint/security/noSecrets: a message key, not a secret.
  const hint = t('popupMarkThisSiteHint');
  return (
    <div className={`sm-well ${styles.noMatch}`}>
      <p className={styles.text}>{t('popupNoMatch')}</p>
      <Button variant="primary" aria-describedby={hintId}>
        {t('popupMarkThisSite')}
      </Button>
      <p id={hintId} className={styles.hint}>
        {hint}
      </p>
    </div>
  );
}
