// biome-ignore-all lint/security/noSecrets: i18n message keys, not secrets
import type { WebsiteMessageKey } from '../i18n/website-t';
import home from './HomePage.module.css';
import styles from './PrivacySection.module.css';
import type { PageProps } from './page-props';

type Permission = {
  name: string;
  icon: string;
  when: WebsiteMessageKey;
  text: WebsiteMessageKey;
};

/** What SiteMark never has; the favicon tint is the one exception (see PRIVACY.md). */
const NEVER: readonly WebsiteMessageKey[] = [
  'websitePrivacyNeverAccounts',
  'websitePrivacyNeverTrackers',
  'websitePrivacyNeverAnalytics',
  'websitePrivacyNeverServers',
  'websitePrivacyNeverRemoteCode',
  'websitePrivacyNeverRequests',
];

/** What a visitor can check in the code: license and storage. */
const PROMISES = [
  { title: 'websitePrivacyFactOpenTitle', text: 'websitePrivacyFactOpenText' },
  { title: 'websitePrivacyFactLocalTitle', text: 'websitePrivacyFactLocalText' },
] as const satisfies readonly { title: WebsiteMessageKey; text: WebsiteMessageKey }[];

/** The manifest's `permissions` and `optional_host_permissions`, in plain words. */
const PERMISSIONS: readonly Permission[] = [
  {
    name: 'storage',
    icon: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
    when: 'websitePrivacyPermissionWhenInstall',
    text: 'websitePrivacyPermissionStorage',
  },
  {
    name: 'scripting',
    icon: 'M8 8 3 12l5 4M16 8l5 4-5 4M14 5l-4 14',
    when: 'websitePrivacyPermissionWhenInstall',
    text: 'websitePrivacyPermissionScripting',
  },
  {
    name: 'activeTab',
    icon: 'M4 5h16v14H4zM4 9h16M8 5v4',
    when: 'websitePrivacyPermissionWhenClick',
    text: 'websitePrivacyPermissionActiveTab',
  },
  {
    name: '*://*/*',
    icon: 'M3 12a9 9 0 1 0 18 0 9 9 0 1 0-18 0M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18',
    when: 'websitePrivacyPermissionWhenSite',
    text: 'websitePrivacyPermissionHosts',
  },
];

/** The home page privacy section (REQ-PAGE-001): what it never has, the permissions it asks for, and two promises. */
export function PrivacySection({ t }: Pick<PageProps, 't'>) {
  return (
    <section className={home.section} aria-labelledby="privacy-summary">
      <h2 id="privacy-summary">{t('websitePrivacySummaryHeading')}</h2>
      <p>{t('websitePrivacySummaryText')}</p>
      <div className={styles.privacy}>
        <div className={`sm-card sm-tape ${styles.sheet} ${styles.never}`}>
          <h3>{t('websitePrivacyNeverHeading')}</h3>
          <ul>
            {NEVER.map((key) => (
              <li key={key}>{t(key)}</li>
            ))}
          </ul>
          <p>{t('websitePrivacyNeverException')}</p>
        </div>
        <div className={`sm-card sm-tape ${styles.sheet} ${styles.permissions}`}>
          <h3>{t('websitePrivacyPermissionsHeading')}</h3>
          <dl>
            {PERMISSIONS.map(({ name, icon, when, text }) => (
              <div key={name}>
                <span className={styles.permDisc} aria-hidden="true">
                  <svg
                    className={home.icon}
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    aria-hidden="true"
                  >
                    <path d={icon} />
                  </svg>
                </span>
                <dt>
                  <code>{name}</code> <span className={styles.when}>{t(when)}</span>
                </dt>
                <dd>{t(text)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <ul className={styles.promises}>
        {PROMISES.map(({ title, text }) => (
          <li key={title}>
            <span className={styles.tick} aria-hidden="true">
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <path d="M5 12l4 4 10-10" />
              </svg>
            </span>
            <h3>{t(title)}</h3>
            <p>{t(text)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
