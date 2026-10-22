// biome-ignore-all lint/security/noSecrets: i18n message keys, not secrets
import { helpTopicsFor } from '../content/help';
import { helpTopicPath } from '../routes/urls';
import { ContactBlock } from './ContactBlock';
import styles from './HelpPage.module.css';
import { HELP_GROUPS, HELP_PROBLEMS } from './help-groups';
import type { PageProps } from './page-props';

/**
 * Help and support (REQ-PAGE-003, REQ-PAGE-004): quick links for common problems, every topic with
 * its description in groups, and the contact routes at the bottom. /support/ shows the same page.
 */
export function HelpPage({ t, locale }: PageProps) {
  const topics = new Map(helpTopicsFor(locale).map((topic) => [topic.topic, topic]));
  return (
    <div className={styles.page}>
      <h1>{t('websiteHelpHeading')}</h1>
      <p className={styles.lead}>{t('websiteHelpLead')}</p>
      <p className={styles.problemsLabel}>{t('websiteHelpProblemsLabel')}</p>
      <ul className={styles.problems}>
        {HELP_PROBLEMS.map(({ text, topic }) => (
          <li key={topic}>
            <a className={`${styles.link} ${styles.pill}`} href={helpTopicPath(topic, locale)}>
              {t(text)}
            </a>
          </li>
        ))}
      </ul>
      {HELP_GROUPS.map(({ heading, topics: group }) => (
        <section key={heading}>
          <h2 className={styles.group}>{t(heading)}</h2>
          <ul className={styles.index}>
            {group.map((topic) => (
              <li key={topic} className={styles.entry}>
                <a className={`${styles.link} ${styles.title}`} href={helpTopicPath(topic, locale)}>
                  {topics.get(topic)?.title}
                </a>
                <p>{topics.get(topic)?.description}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <ContactBlock t={t} />
    </div>
  );
}
