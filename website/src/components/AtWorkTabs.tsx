// biome-ignore-all lint/security/noSecrets: i18n message keys, not secrets
import type { PageProps } from '../pages/page-props';
import styles from './AtWorkTabs.module.css';
import { Backdrop } from './AtWorkViews';
import viewStyles from './AtWorkViews.module.css';

type Props = Pick<PageProps, 't'>;

/** The favicon note: a browser tab strip where only the current tab is marked. */
export function Tabs({ t }: Props) {
  const others = ['websiteAtWorkTabMail', 'websiteAtWorkTabDocs', 'websiteAtWorkTabShop'] as const;
  return (
    <div role="img" aria-label={t('websiteAtWorkFaviconAlt')} className={viewStyles.view}>
      <span className={styles.strip}>
        <span className={`${styles.tab} ${styles.current}`}>
          <span className={styles.icon} />
          <span>
            <span className={styles.prefix}>{`[${t('websiteAtWorkMarkProd')}] `}</span>
            {t('websiteAtWorkTabAdmin')}
          </span>
        </span>
        {others.map((key) => (
          <span key={key} className={styles.tab}>
            <span className={styles.icon} />
            {t(key)}
          </span>
        ))}
      </span>
      <span className={styles.toolbar}>
        <span />
      </span>
      <span className={styles.body}>
        <Backdrop />
      </span>
    </div>
  );
}
