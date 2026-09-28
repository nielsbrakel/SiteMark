// biome-ignore-all lint/security/noSecrets: i18n message keys, not secrets
import {
  SCREENSHOT_SIZE,
  type ScreenshotScene,
  screenshotFile,
  screenshotScenes,
  screenshotThemes,
} from '../content/screenshots';
import type { WebsiteMessageKey } from '../i18n/website-t';
import type { PageProps } from '../pages/page-props';
import { assetUrl } from '../routes/urls';
import styles from './Screenshots.module.css';

type Texts = { caption: WebsiteMessageKey; alt: WebsiteMessageKey };

const TEXTS: Record<ScreenshotScene, Texts> = {
  'marked-page': {
    caption: 'websiteScreenshotMarkedPageCaption',
    alt: 'websiteScreenshotMarkedPageAlt',
  },
  popup: { caption: 'websiteScreenshotPopupCaption', alt: 'websiteScreenshotPopupAlt' },
  options: { caption: 'websiteScreenshotOptionsCaption', alt: 'websiteScreenshotOptionsAlt' },
};

type Props = Omit<PageProps, 'tp'>;

/** One scene in both themes; CSS shows the active theme's, and the other one never loads. */
function Screenshot({ scene, t, locale }: Props & { scene: ScreenshotScene }) {
  const { caption, alt } = TEXTS[scene];
  return (
    <figure className={styles.figure}>
      {screenshotThemes().map((theme) => (
        <picture key={theme} data-theme={theme} className={styles[theme]}>
          <source
            type="image/webp"
            srcSet={assetUrl(screenshotFile(scene, theme, locale, 'webp'))}
          />
          <img
            className={styles.image}
            src={assetUrl(screenshotFile(scene, theme, locale, 'png'))}
            alt={t(alt)}
            width={SCREENSHOT_SIZE.width / 2}
            height={SCREENSHOT_SIZE.height / 2}
            loading="lazy"
            decoding="async"
          />
        </picture>
      ))}
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
