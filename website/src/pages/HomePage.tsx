// biome-ignore-all lint/security/noSecrets: i18n message keys, not secrets
import { AtWork } from '../components/AtWork';
import { type CardItem, CardList } from '../components/CardList';
import { InstallButtons } from '../components/InstallButtons';
import { stores } from '../config/stores';
import { Island } from '../islands/islands';
import '../hero/hero-styles';
import { pagePath } from '../routes/urls';
import styles from './HomePage.module.css';
import { PrivacySection } from './PrivacySection';
import type { PageProps } from './page-props';

/** The three extension goals (REQ-PAGE-001), each with a small inline icon (an SVG path). */
const HIGHLIGHTS: readonly CardItem[] = [
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
      <CardList items={HIGHLIGHTS} t={t} />
    </section>
  );
}

/** The heading with its key word (the production environment) on a highlighter stroke. */
function Heading({ t }: Pick<PageProps, 't'>) {
  const heading = t('websiteHomeHeading');
  const word = t('websiteHomeHeadingMark');
  const at = heading.indexOf(word);
  if (at < 0) return <h1 className={styles.title}>{heading}</h1>;
  return (
    <h1 className={styles.title}>
      {heading.slice(0, at)}
      <mark>{word}</mark>
      {heading.slice(at + word.length)}
    </h1>
  );
}

/**
 * Home (REQ-PAGE-001): value proposition, install buttons, the before/after hero, highlights, SiteMark at work
 * (REQ-PAGE-009) and the privacy section.
 */
export function HomePage({ t, locale }: PageProps) {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <Heading t={t} />
          <p className={styles.lead}>{t('websiteHomeLead')}</p>
          <InstallButtons stores={stores()} t={t} />
        </div>
        <div className={styles.heroPreview}>
          <Island id="heroCompare" t={t} />
          <a className={`sm-link ${styles.link}`} href={pagePath('playground', locale)}>
            {t('websiteHeroPlaygroundLink')}
          </a>
        </div>
      </section>
      <Highlights t={t} />
      <AtWork t={t} />
      <PrivacySection t={t} />
    </>
  );
}
