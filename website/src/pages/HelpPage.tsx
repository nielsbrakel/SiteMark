import { helpTopicsFor } from '../content/help';
import { helpTopicPath } from '../routes/urls';
import styles from './HelpPage.module.css';
import type { PageProps } from './page-props';

/** The help index (REQ-PAGE-004): every topic with its description, in the topics' order. */
export function HelpPage({ t, locale }: PageProps) {
  return (
    <div className={styles.page}>
      <h1>{t('websiteHelpHeading')}</h1>
      <p className={styles.lead}>{t('websiteHelpLead')}</p>
      <ul className={styles.index}>
        {helpTopicsFor(locale).map(({ topic, title, description }) => (
          <li key={topic} className={styles.entry}>
            <a className={styles.title} href={helpTopicPath(topic, locale)}>
              {title}
            </a>
            <p>{description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
