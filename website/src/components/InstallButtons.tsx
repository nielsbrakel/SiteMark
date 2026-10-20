import type { Store } from '../config/stores';
import type { PageProps } from '../pages/page-props';
import { ExternalLink } from './ExternalLink';
import styles from './InstallButtons.module.css';

type InstallButtonsProps = { stores: readonly Store[]; t: PageProps['t'] };

/** Browser names are brands: the same in every language. */
const NAMES: Record<Store['id'], string> = {
  chrome: 'Chrome',
  edge: 'Edge',
  firefox: 'Firefox',
  safari: 'Safari',
};

function InstallButton({ store, t }: { store: Store; t: PageProps['t'] }) {
  const name = NAMES[store.id];
  if (store.url !== null) {
    return (
      <ExternalLink className={`sm-button ${styles.button}`} href={store.url}>
        {t('websiteInstallAdd', [name])}
      </ExternalLink>
    );
  }
  // Not listed yet: a disabled button, never a dead link (REQ-PAGE-002).
  return (
    <button type="button" className={`sm-button ${styles.button}`} disabled>
      {t('websiteInstallComingLater', [name])}
    </button>
  );
}

/**
 * One item per store: a link to the listing, or a disabled "coming in the future" button (REQ-PAGE-002). The
 * CSS turns the visitor's store into the one big button (Chrome when the browser isn't recognised)
 * and the others into plain links; the computer note only shows to iOS visitors.
 */
export function InstallButtons({ stores, t }: InstallButtonsProps) {
  return (
    <ul className={styles.list} aria-label={t('websiteInstallLabel')}>
      <li className={styles.also}>{t('websiteInstallAlso')}</li>
      {/* biome-ignore lint/security/noSecrets: an i18n key, not a secret */}
      <li className={styles.computer}>{t('websiteInstallOnComputer')}</li>
      {stores.map((store) => (
        <li key={store.id} className={styles[store.id]}>
          <InstallButton store={store} t={t} />
        </li>
      ))}
    </ul>
  );
}
