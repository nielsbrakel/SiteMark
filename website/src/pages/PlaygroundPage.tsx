// biome-ignore-all lint/security/noSecrets: i18n message keys, not secrets
import { ThemedPicture } from '../components/ThemedPicture';
import { PLAYGROUND_PREVIEW_SIZE, playgroundPreviewFile } from '../content/playground-preview';
import { Island } from '../islands/islands';
import '../playground/playground-styles';
import styles from './PlaygroundPage.module.css';
import type { PageProps } from './page-props';

/** Without JavaScript (REQ-PLAY-003): a note and the generated image of the default preview. */
function NoScriptPreview({ t, locale }: Omit<PageProps, 'tp'>) {
  return (
    <div className={styles.noScript}>
      <p>{t('websitePlaygroundNoScript')}</p>
      <ThemedPicture
        file={(theme, format) => playgroundPreviewFile(theme, locale, format)}
        alt={t('websitePlaygroundFallbackAlt')}
        width={PLAYGROUND_PREVIEW_SIZE.width}
        height={PLAYGROUND_PREVIEW_SIZE.height}
        className={styles.image}
      />
    </div>
  );
}

/**
 * The playground (REQ-PLAY-001): a mark on a mock browser window, drawn by the extension's own code.
 * The controls are an island, so only this page and the home hero load the playground's code.
 */
export function PlaygroundPage({ t, locale }: PageProps) {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('websitePlaygroundHeading')}</h1>
      <p className={styles.lead}>{t('websitePlaygroundLead')}</p>
      <NoScriptPreview t={t} locale={locale} />
      <div className={styles.live}>
        <Island id="playground" t={t} />
      </div>
    </div>
  );
}
