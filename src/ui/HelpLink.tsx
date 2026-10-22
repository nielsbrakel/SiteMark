import type { ReactNode } from 'react';
import { t } from '@/lib/i18n/browser-source';
import { helpUrl } from '@/lib/site-links';
import { ExternalIcon } from '@/ui/components/icons';
import styles from './HelpLink.module.css';

/** The header link to the website's help; it opens in a new tab, which the arrow shows. */
export function HelpLink(): ReactNode {
  return (
    <a
      className={`sm-nav-link ${styles.help}`}
      href={helpUrl()}
      target="_blank"
      rel="noopener noreferrer"
    >
      {t('helpNav')}
      <ExternalIcon />
    </a>
  );
}
