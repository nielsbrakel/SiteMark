// biome-ignore-all lint/security/noSecrets: i18n message keys, not secrets
import type { ReactNode } from 'react';
import type { PageProps } from '../pages/page-props';
import styles from './AtWork.module.css';
import { Tabs } from './AtWorkTabs';
import { Dialog, Page } from './AtWorkViews';

type Props = Pick<PageProps, 't'>;

const NOTES: readonly {
  view: (props: Props) => ReactNode;
  title: 'websiteAtWorkFaviconTitle' | 'websiteAtWorkPageTitle' | 'websiteAtWorkComponentTitle';
  text: 'websiteAtWorkFaviconText' | 'websiteAtWorkPageText' | 'websiteAtWorkComponentText';
}[] = [
  {
    view: Tabs,
    title: 'websiteAtWorkFaviconTitle',
    text: 'websiteAtWorkFaviconText',
  },
  {
    view: Page,
    title: 'websiteAtWorkPageTitle',
    text: 'websiteAtWorkPageText',
  },
  {
    view: Dialog,
    title: 'websiteAtWorkComponentTitle',
    text: 'websiteAtWorkComponentText',
  },
];

/**
 * SiteMark at work (REQ-PAGE-009, D-291): the favicon, the page and one component, drawn as three
 * taped notes. A checkbox switch adds the marks to all three through `:has`, so it needs no script.
 */
export function AtWork({ t }: Props) {
  return (
    <section className={styles.section} aria-labelledby="at-work">
      <h2 id="at-work">{t('websiteAtWorkHeading')}</h2>
      <p className={styles.lead}>{t('websiteAtWorkLead')}</p>
      <div className={styles.scene} data-marks>
        <span className={styles.switchRow}>
          <label htmlFor="at-work-switch">{t('websiteAtWorkSwitch')}</label>
          {/* biome-ignore lint/a11y/useAriaPropsForRole: a native checkbox carries the checked state */}
          <input id="at-work-switch" className={styles.switch} type="checkbox" role="switch" />
        </span>
        <p className={styles.question} aria-live="polite">
          <span className={styles.off}>{t('websiteAtWorkQuestionOff')}</span>
          <span className={styles.on}>{t('websiteAtWorkQuestionOn')}</span>
        </p>
        <ul className={styles.notes}>
          {NOTES.map(({ view: View, title, text }) => (
            <li key={title} className={`sm-card sm-tape ${styles.note}`}>
              <View t={t} />
              <h3>{t(title)}</h3>
              <p>{t(text)}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
