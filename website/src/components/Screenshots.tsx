// biome-ignore-all lint/security/noSecrets: i18n message keys, not secrets
import {
  SCREENSHOT_SIZE,
  type ScreenshotScene,
  screenshotFile,
  screenshotScenes,
} from '../content/screenshots';
import type { WebsiteMessageKey } from '../i18n/website-t';
import type { PageProps } from '../pages/page-props';
import styles from './Screenshots.module.css';
import { ThemedPicture } from './ThemedPicture';

type Texts = { caption: WebsiteMessageKey; alt: WebsiteMessageKey };

const TEXTS: Record<ScreenshotScene, Texts> = {
  'marked-page': {
    caption: 'websiteScreenshotMarkedPageCaption',
    alt: 'websiteScreenshotMarkedPageAlt',
  },
  popup: { caption: 'websiteScreenshotPopupCaption', alt: 'websiteScreenshotPopupAlt' },
  options: { caption: 'websiteScreenshotOptionsCaption', alt: 'websiteScreenshotOptionsAlt' },
};

type Props = Pick<PageProps, 't' | 'locale'>;

/** One scene in both themes, shown at 2× density. */
function Screenshot({ scene, t, locale }: Props & { scene: ScreenshotScene }) {
  const { caption, alt } = TEXTS[scene];
  return (
    <figure className={styles.figure}>
      <ThemedPicture
        file={(theme, format) => screenshotFile(scene, theme, locale, format)}
        alt={t(alt)}
        width={SCREENSHOT_SIZE.width / 2}
        height={SCREENSHOT_SIZE.height / 2}
        className={styles.image}
      />
      <figcaption className={styles.caption}>{t(caption)}</figcaption>
    </figure>
  );
}

/**
 * The generated screenshots (REQ-PAGE-008, D-251) of the page's language, in the active theme: the
 * OS unless the theme toggle overrides it.
 */
export function Screenshots({ t, locale }: Props) {
  return (
    <section className={styles.section} aria-labelledby="screenshots">
      <h2 id="screenshots">{t('websiteScreenshotsHeading')}</h2>
      <div className={styles.list}>
        {screenshotScenes().map((scene) => (
          <Screenshot key={scene} scene={scene} t={t} locale={locale} />
        ))}
      </div>
    </section>
  );
}
