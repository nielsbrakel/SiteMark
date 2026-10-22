// biome-ignore-all lint/security/noSecrets: i18n message keys, not secrets
import { type CardItem, CardList } from '../components/CardList';
import type { WebsiteMessageKey } from '../i18n/website-t';
import styles from './HomePage.module.css';
import type { PageProps } from './page-props';

type Permission = {
  name: string;
  icon: string;
  when: WebsiteMessageKey;
  text: WebsiteMessageKey;
};

/** What a visitor can check in the code: license, storage, analytics and network (see PRIVACY.md). */
const FACTS: readonly CardItem[] = [
  {
    icon: 'M8 8 3 12l5 4M16 8l5 4-5 4M14 5l-4 14',
    title: 'websitePrivacyFactOpenTitle',
    text: 'websitePrivacyFactOpenText',
  },
  {
    icon: 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5z',
    title: 'websitePrivacyFactLocalTitle',
    text: 'websitePrivacyFactLocalText',
  },
  {
    icon: 'M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18M4 4l16 16',
    title: 'websitePrivacyFactNoTrackingTitle',
    text: 'websitePrivacyFactNoTrackingText',
  },
];

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

/** The home page privacy section (REQ-PAGE-001): the claims, and the permissions. */
export function PrivacySection({ t }: Pick<PageProps, 't'>) {
  return (
    <section className={styles.section} aria-labelledby="privacy-summary">
      <h2 id="privacy-summary">{t('websitePrivacySummaryHeading')}</h2>
      <p>{t('websitePrivacySummaryText')}</p>
      <CardList items={FACTS} t={t} />
      <div className={`sm-card sm-tape ${styles.permissions}`}>
        <h3>{t('websitePrivacyPermissionsHeading')}</h3>
        <dl>
          {PERMISSIONS.map(({ name, icon, when, text }) => (
            <div key={name}>
              <span className={styles.permDisc} aria-hidden="true">
                <svg
                  className={styles.icon}
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
    </section>
  );
}
