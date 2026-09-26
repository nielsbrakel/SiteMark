import type { PageProps } from '../pages/page-props';
import styles from './HeroIllustration.module.css';

type Props = { t: PageProps['t'] };

/** The mock browser's tab strip and address bar; the tab title carries the title prefix. */
function BrowserChrome({ t }: Props) {
  return (
    <>
      <rect className={styles.window} x="1" y="1" width="478" height="298" rx="14" />
      <rect className={styles.tab} x="16" y="8" width="176" height="30" rx="8" />
      <text className={styles.tabText} x="28" y="28">
        {t('websiteHeroTab')}
      </text>
      <rect className={styles.address} x="16" y="46" width="448" height="24" rx="12" />
      <text className={styles.addressText} x="32" y="62">
        {t('websiteHeroAddress')}
      </text>
    </>
  );
}

/** Sample page content with the scary button, outlined by an element mark. */
function PageContent({ t }: Props) {
  return (
    <>
      <rect className={styles.skeleton} x="32" y="122" width="210" height="12" rx="6" />
      <rect className={styles.skeleton} x="32" y="146" width="320" height="10" rx="5" />
      <rect className={styles.skeleton} x="32" y="166" width="270" height="10" rx="5" />
      <rect className={styles.button} x="32" y="214" width="156" height="34" rx="8" />
      <text className={styles.buttonText} x="110" y="236">
        {t('websiteHeroButton')}
      </text>
      <rect className={styles.outline} x="25" y="207" width="170" height="48" rx="11" />
    </>
  );
}

/** Page marks: a frame, a top banner and a corner ribbon (what SiteMark draws). */
function Marks({ t }: Props) {
  return (
    <>
      <rect className={styles.frame} x="4" y="80" width="472" height="216" />
      <rect className={styles.mark} x="4" y="80" width="472" height="24" />
      <text className={styles.markText} x="240" y="96">
        {t('websiteHeroBanner')}
      </text>
      <polygon className={styles.mark} points="396,104 436,104 476,144 476,184" />
      <text className={styles.markText} x="448" y="148" transform="rotate(45 448 144)">
        {t('websiteHeroRibbon')}
      </text>
    </>
  );
}

/**
 * The static W1 hero (REQ-PAGE-001): a production page as SiteMark marks it. Inline SVG, so it loads
 * nothing (REQ-WEB-003) and follows the theme; the text alternative says what it shows.
 */
export function HeroIllustration({ t }: Props) {
  return (
    <svg
      className={styles.hero}
      viewBox="0 0 480 300"
      width="480"
      height="300"
      role="img"
      aria-label={t('websiteHeroAlt')}
    >
      <BrowserChrome t={t} />
      <PageContent t={t} />
      <Marks t={t} />
    </svg>
  );
}
