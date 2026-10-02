import type { ReactNode } from 'react';
import { type MessageKey, t } from '@/lib/i18n/browser-source';
import { privacyUrl, repositoryUrl, websiteUrl } from '@/lib/site-links';
import styles from './SiteLinks.module.css';

/** The small footer of the popup and the options page: website, GitHub and the privacy policy. */
export function SiteLinks(): ReactNode {
  const links: readonly (readonly [MessageKey, string])[] = [
    ['footerWebsite', websiteUrl()],
    ['footerGitHub', repositoryUrl()],
    ['footerPrivacy', privacyUrl()],
  ];
  return (
    <ul className={styles.links}>
      {links.map(([label, href]) => (
        <li key={label}>
          <a href={href} target="_blank" rel="noopener noreferrer">
            {t(label)}
          </a>
        </li>
      ))}
    </ul>
  );
}
