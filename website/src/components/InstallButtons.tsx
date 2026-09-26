import { installState, type Store } from '../config/stores';
import type { WebsiteMessageKey } from '../i18n/website-t';
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

const COMING: Record<'comingSoon' | 'comingLater', WebsiteMessageKey> = {
  comingSoon: 'websiteInstallComingSoon',
  comingLater: 'websiteInstallComingLater',
};

function InstallButton({ store, t }: { store: Store; t: PageProps['t'] }) {
  const state = installState(store);
  const name = NAMES[store.id];
  if (state === 'live' && store.url !== null) {
    return (
      <ExternalLink className={`sm-button sm-button--primary ${styles.button}`} href={store.url}>
        {t('websiteInstallAdd', [name])}
      </ExternalLink>
    );
  }
  // Not listed yet: a disabled button, never a dead link (REQ-PAGE-002).
  const coming = state === 'comingLater' ? COMING.comingLater : COMING.comingSoon;
  return (
    <button type="button" className={`sm-button ${styles.button}`} disabled>
      {t(coming, [name])}
    </button>
  );
}

/** One button per store: a link to the listing, or a disabled coming-soon button (REQ-PAGE-002). */
export function InstallButtons({ stores, t }: InstallButtonsProps) {
  return (
    <ul className={styles.list} aria-label={t('websiteInstallLabel')}>
      {stores.map((store) => (
        <li key={store.id}>
          <InstallButton store={store} t={t} />
        </li>
      ))}
    </ul>
  );
}
