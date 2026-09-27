import type { ReactNode } from 'react';
import type { OriginPattern } from '@/core/url/origin';
import { t } from '@/lib/i18n/browser-source';
import { grantPageUrl } from '@/platform/grant-page';
import { requestOrigins } from '@/platform/permissions';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import styles from './AccessNotice.module.css';
import { popupTabs } from './popup-ports';

export type AccessNoticeProps = {
  /** The page's host, as the user knows it. */
  readonly host: string;
  /** The origins that aren't granted yet (neededOrigins). */
  readonly origins: readonly OriginPattern[];
};

/** "SiteMark needs access to <host> …" plus Allow (REQ-POP-004, design.md §5.1 C). */
export function AccessNotice({ host, origins }: AccessNoticeProps): ReactNode {
  const allow = () => {
    // D-229: prompt first, synchronously in the click. The background completes the grant on
    // permissions.onAdded; where the popup can't prompt, grant.html asks instead.
    const outcome = requestOrigins(origins);
    void outcome.then((answer) => {
      if (answer === 'failed') void popupTabs.create(grantPageUrl(origins));
    });
  };
  return (
    <Card tone="warning" className={styles.notice}>
      <p className={styles.text}>{t('popupNeedsAccess', host)}</p>
      <Button variant="primary" onClick={allow}>
        {t('popupAllow')}
      </Button>
    </Card>
  );
}
