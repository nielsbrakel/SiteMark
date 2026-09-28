// biome-ignore-all lint/security/noSecrets: i18n message keys, not secrets
import { changelogBody, changelogReleases, changelogSource } from '../content/changelog';
import { Markdown } from '../content/markdown';
import styles from './ChangelogPage.module.css';
import type { PageProps } from './page-props';

type ChangelogProps = Pick<PageProps, 't' | 'locale'> & { source: string | undefined };

/**
 * The release notes (REQ-PAGE-005). They are English only (D-255): other languages get a notice in
 * their own language, and the notes carry `lang="en"`.
 */
export function Changelog({ source, t, locale }: ChangelogProps) {
  if (!source || !changelogReleases(source).length) {
    return <p className={styles.empty}>{t('websiteChangelogEmpty')}</p>;
  }
  const notes = <Markdown source={changelogBody(source)} file="CHANGELOG.md" />;
  if (locale === 'en') return notes;
  return (
    <>
      <p className={styles.notice}>{t('websiteChangelogEnglishOnly')}</p>
      <div lang="en">{notes}</div>
    </>
  );
}

/** The changelog page: CHANGELOG.md from the repository, rendered at build time. */
export function ChangelogPage({ t, locale }: PageProps) {
  return (
    <div className={styles.page}>
      <h1>{t('websiteChangelogHeading')}</h1>
      <Changelog source={changelogSource()} t={t} locale={locale} />
    </div>
  );
}
