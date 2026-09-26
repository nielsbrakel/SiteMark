// biome-ignore-all lint/security/noSecrets: i18n message keys, not secrets
import { HeroIllustration } from '../components/HeroIllustration';
import { InstallButtons } from '../components/InstallButtons';
import { stores } from '../config/stores';
import type { WebsiteMessageKey } from '../i18n/website-t';
import { pagePath } from '../routes/urls';
import styles from './HomePage.module.css';
import type { PageProps } from './page-props';

type Highlight = { icon: string; title: WebsiteMessageKey; text: WebsiteMessageKey };

/** The three extension goals (REQ-PAGE-001), each with a small inline icon (an SVG path). */
const HIGHLIGHTS: readonly Highlight[] = [
  {
    icon: 'M4 4h16v4H4zM4 10l8 10 8-10',
    title: 'websiteHighlightUnmistakableTitle',
    text: 'websiteHighlightUnmistakableText',
  },
  {
    icon: 'M5 12l4 4 10-10',
    title: 'websiteHighlightSimpleTitle',
    text: 'websiteHighlightSimpleText',
  },
  {
    icon: 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5z',
    title: 'websiteHighlightPrivateTitle',
    text: 'websiteHighlightPrivateText',
  },
];

function Highlights({ t }: Pick<PageProps, 't'>) {
  return (
    <section className={styles.section} aria-labelledby="highlights">
      <h2 id="highlights" className="sm-visually-hidden">
        {t('websiteHomeHighlightsHeading')}
      </h2>
      <ul className={styles.cards}>
        {HIGHLIGHTS.map(({ icon, title, text }) => (
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
    </section>
  );
}

function PrivacySummary({ t, locale }: Omit<PageProps, 'tp'>) {
  return (
    <section className={styles.section} aria-labelledby="privacy-summary">
      <h2 id="privacy-summary">{t('websitePrivacySummaryHeading')}</h2>
      <p>{t('websitePrivacySummaryText')}</p>
      <p>
        <a className={styles.link} href={pagePath('privacy', locale)}>
          {t('websitePrivacySummaryLink')}
        </a>
      </p>
    </section>
  );
}

/** Home (REQ-PAGE-001): value proposition, install buttons, hero, highlights, privacy summary. */
export function HomePage({ t, locale }: PageProps) {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <h1 className={styles.title}>{t('websiteHomeHeading')}</h1>
          <p className={styles.lead}>{t('websiteHomeLead')}</p>
          <InstallButtons stores={stores()} t={t} />
        </div>
        <HeroIllustration t={t} />
      </section>
      <Highlights t={t} />
      <PrivacySummary t={t} locale={locale} />
    </>
  );
}
