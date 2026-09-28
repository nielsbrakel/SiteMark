// biome-ignore-all lint/security/noSecrets: i18n message keys, not secrets
import { PlaygroundFallback } from '../components/PlaygroundFallback';
import { Island } from '../islands/islands';
import '../playground/playground-styles';
import styles from './PlaygroundPage.module.css';
import type { PageProps } from './page-props';

/**
 * The playground (REQ-PLAY-001): a mark on a mock browser window, drawn by the extension's own code.
 * The controls are an island, so only this page and the home hero load the playground's code.
 */
export function PlaygroundPage({ t, locale }: PageProps) {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('websitePlaygroundHeading')}</h1>
      <p className={styles.lead}>{t('websitePlaygroundLead')}</p>
      <PlaygroundFallback t={t} locale={locale}>
        <Island id="playground" t={t} />
      </PlaygroundFallback>
    </div>
  );
}
