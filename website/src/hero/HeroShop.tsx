// biome-ignore-all lint/security/noSecrets: i18n message keys, not secrets
import type { IslandProps } from '../islands/island-props';
import styles from './HeroShop.module.css';

type Props = Pick<IslandProps, 't'> & {
  /** Draws SiteMark's marks on the page: the tab's dot and prefix, a frame, a banner, a ribbon. */
  readonly marked: boolean;
};

const MARKED = { 'data-marked': true } as const;

/** The sample customer and page: made-up data, shown the same in every language. */
const SAMPLE = {
  initials: 'MJ',
  name: 'Mara Jansen',
  email: 'mara@example.com',
  address: 'shop.example.com/customers/412',
} as const;

/** The mock browser's tab strip: another tab, and the shop's tab with its favicon. */
function Tabs({ t, marked }: Props) {
  const title = `${t('websiteHeroCustomers')} · ${t('websitePlaygroundPageTitle')}`;
  return (
    <div className={styles.tabs}>
      <span className={`${styles.tab} ${styles.other}`}>
        <span className={styles.icon} />
        {t('websiteHeroInbox')}
      </span>
      <span className={`${styles.tab} ${styles.current}`}>
        <span className={styles.icon} {...(marked && MARKED)} />
        <span className={styles.title}>
          {marked ? `[${t('websiteAtWorkMarkProd')}] ${title}` : title}
        </span>
      </span>
    </div>
  );
}

/** The customer page of the sample shop (REQ-PLAY-004): a page where deleting is dangerous. */
function Page({ t, marked }: Props) {
  return (
    <div className={styles.page}>
      <div className={styles.nav}>
        <span className={styles.logo} />
        <b>{t('websitePlaygroundPageTitle')}</b>
        <span className={styles.menu}>
          <span className={styles.stub} />
          <span className={styles.active}>{t('websiteHeroCustomers')}</span>
          <span className={styles.stub} />
        </span>
      </div>
      <div className={styles.customer}>
        <span className={styles.avatar}>{SAMPLE.initials}</span>
        <span className={styles.who}>
          <b>{SAMPLE.name}</b>
          <span>{SAMPLE.email}</span>
        </span>
      </div>
      <div className={styles.actions}>
        <span className={styles.edit}>{t('websiteHeroEdit')}</span>
        <span className={styles.delete} {...(marked && MARKED)}>
          {t('websitePlaygroundDeleteButton')}
        </span>
      </div>
      <div className={styles.stats}>
        <span />
        <span />
        <span />
      </div>
      {marked && (
        <span className={styles.marks}>
          <span className={styles.banner}>{t('websiteAtWorkMarkProduction')}</span>
          <span className={styles.ribbon}>{t('websiteAtWorkMarkProd')}</span>
        </span>
      )}
    </div>
  );
}

/** One copy of the shop in a mock browser window; the hero draws it twice, plain and marked. */
export function HeroShop({ t, marked }: Props) {
  return (
    <div className={styles.browser} data-layer={marked ? 'after' : 'before'}>
      <Tabs t={t} marked={marked} />
      <div className={styles.address}>{SAMPLE.address}</div>
      <Page t={t} marked={marked} />
    </div>
  );
}
