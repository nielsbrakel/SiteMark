// biome-ignore-all lint/security/noSecrets: i18n message keys, not secrets
import type { WebsiteMessageKey } from '../i18n/website-t';
import { pagePath } from '../routes/urls';
import styles from './HomePage.module.css';
import type { PageProps } from './page-props';

type Fact = { icon: string; title: WebsiteMessageKey; text: WebsiteMessageKey };
type Permission = { name: string; text: WebsiteMessageKey };

/** What a visitor can check in the code: license, analytics, storage and network (see PRIVACY.md). */
const FACTS: readonly Fact[] = [
  {
    icon: 'M8 8 3 12l5 4M16 8l5 4-5 4M14 5l-4 14',
    title: 'websitePrivacyFactOpenTitle',
    text: 'websitePrivacyFactOpenText',
  },
  {
    icon: 'M4 4l16 16M10.6 6.1A9 9 0 0 1 21 12a9 9 0 0 1-2.2 3M6.5 7.6A9 9 0 0 0 3 12a9 9 0 0 0 9 6 9 9 0 0 0 2.7-.4',
    title: 'websitePrivacyFactNoAnalyticsTitle',
    text: 'websitePrivacyFactNoAnalyticsText',
  },
  {
    icon: 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5z',
    title: 'websitePrivacyFactLocalTitle',
    text: 'websitePrivacyFactLocalText',
  },
  {
    icon: 'M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18M4 4l16 16',
    title: 'websitePrivacyFactNoRequestsTitle',
    text: 'websitePrivacyFactNoRequestsText',
  },
];

/** The manifest's `permissions` and `optional_host_permissions`, in plain words. */
const PERMISSIONS: readonly Permission[] = [
  { name: 'storage', text: 'websitePrivacyPermissionStorage' },
  { name: 'scripting', text: 'websitePrivacyPermissionScripting' },
  { name: 'activeTab', text: 'websitePrivacyPermissionActiveTab' },
  { name: '*://*/*', text: 'websitePrivacyPermissionHosts' },
];

/** The home page privacy section (REQ-PAGE-001): the claims, the permissions and the policy link. */
export function PrivacySection({ t, locale }: Pick<PageProps, 't' | 'locale'>) {
  return (
    <section className={styles.section} aria-labelledby="privacy-summary">
      <h2 id="privacy-summary">{t('websitePrivacySummaryHeading')}</h2>
      <p>{t('websitePrivacySummaryText')}</p>
      <ul className={styles.cards}>
        {FACTS.map(({ icon, title, text }) => (
          <li key={title} className={`sm-card ${styles.card}`}>
            <svg
              className={styles.icon}
              viewBox="0 0 24 24"
              width="28"
              height="28"
              aria-hidden="true"
            >
              <path d={icon} />
            </svg>
            <h3>{t(title)}</h3>
            <p>{t(text)}</p>
          </li>
        ))}
      </ul>
      <div className={`sm-well ${styles.permissions}`}>
        <h3>{t('websitePrivacyPermissionsHeading')}</h3>
        <dl>
          {PERMISSIONS.map(({ name, text }) => (
            <div key={name}>
              <dt>
                <code>{name}</code>
              </dt>
              <dd>{t(text)}</dd>
            </div>
          ))}
        </dl>
      </div>
      <p>
        <a className={styles.link} href={pagePath('privacy', locale)}>
          {t('websitePrivacySummaryLink')}
        </a>
      </p>
    </section>
  );
}
