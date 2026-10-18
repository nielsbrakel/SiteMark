// biome-ignore-all lint/security/noSecrets: i18n message keys, not secrets
import type { PageProps } from '../pages/page-props';
import styles from './AtWorkViews.module.css';

type Props = Pick<PageProps, 't'>;

/** The faint page behind every note: a nav row, a heading bar and three cells. */
export function Backdrop() {
  return (
    <span className={styles.backdrop}>
      <span className={styles.nav}>
        <span className={styles.dot} />
        <span className={styles.stub} />
        <span className={styles.stub} />
      </span>
      <span className={styles.bar} />
      <span className={styles.cells}>
        <span />
        <span />
        <span />
      </span>
    </span>
  );
}

/** The page note: a frame, a corner ribbon and a banner. */
export function Page({ t }: Props) {
  return (
    <div
      role="img"
      aria-label={t('websiteAtWorkPageAlt')}
      className={`${styles.view} ${styles.page}`}
    >
      <Backdrop />
      <span className={styles.ribbon}>{t('websiteAtWorkMarkProd')}</span>
      <span className={styles.banner}>{t('websiteAtWorkMarkProduction')}</span>
    </div>
  );
}

/** The component note: one dialog with an outline and a ribbon of its own. */
export function Dialog({ t }: Props) {
  return (
    <div role="img" aria-label={t('websiteAtWorkComponentAlt')} className={styles.view}>
      <Backdrop />
      <span className={styles.scrim} />
      <span className={styles.dialog}>
        <span className={styles.ribbon}>{t('websiteAtWorkMarkProd')}</span>
        <span className={styles.dialogTitle}>{t('websiteAtWorkDialogTitle')}</span>
        <span className={styles.buttons}>
          <span>{t('websiteAtWorkDialogCancel')}</span>
          <span className={styles.danger}>{t('websiteAtWorkDialogConfirm')}</span>
        </span>
      </span>
    </div>
  );
}
