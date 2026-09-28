// biome-ignore-all lint/security/noSecrets: i18n message keys, not secrets
import type { ReactNode } from 'react';
import { PLAYGROUND_PREVIEW_SIZE, playgroundPreviewFile } from '../content/playground-preview';
import type { PageProps } from '../pages/page-props';
import styles from './PlaygroundFallback.module.css';
import { ThemedPicture } from './ThemedPicture';

type Props = Pick<PageProps, 't' | 'locale'> & {
  /** The playground island, shown only with JavaScript. */
  readonly children: ReactNode;
};

/**
 * A playground with its no-JavaScript stand-in (REQ-PLAY-003): without JavaScript the controls
 * can't work, so a note and the generated image of the default preview show instead.
 */
export function PlaygroundFallback({ t, locale, children }: Props) {
  return (
    <>
      <div className={styles.noScript}>
        <p className={styles.note}>{t('websitePlaygroundNoScript')}</p>
        <ThemedPicture
          file={(theme, format) => playgroundPreviewFile(theme, locale, format)}
          alt={t('websitePlaygroundFallbackAlt')}
          width={PLAYGROUND_PREVIEW_SIZE.width}
          height={PLAYGROUND_PREVIEW_SIZE.height}
          className={styles.image}
        />
      </div>
      <div className={styles.live}>{children}</div>
    </>
  );
}
