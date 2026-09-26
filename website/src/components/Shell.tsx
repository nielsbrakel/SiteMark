import type { ReactNode } from 'react';
import type { Locale } from '../i18n/locales';
import type { PageProps } from '../pages/page-props';
import type { Route } from '../routes/routes';
import { Footer } from './Footer';
import { Header } from './Header';
import styles from './Shell.module.css';

export type ShellProps = {
  /** The route of the page being shown (marked with aria-current). */
  route: Route;
  locale: Locale;
  /** The routes that have a page; only these are linked (REQ-PAGE-007). */
  routes: readonly Route[];
  t: PageProps['t'];
  /** The page content, rendered inside <main>. */
  children: ReactNode;
};

/** The frame of every page: skip link, header, main and footer (REQ-PAGE-007). */
export function Shell({ route, locale, routes, t, children }: ShellProps) {
  return (
    <div className={styles.shell}>
      <a className={styles.skip} href="#main">
        {t('websiteSkipToContent')}
      </a>
      <Header route={route} locale={locale} routes={routes} t={t} />
      <main id="main" className={styles.main}>
        {children}
      </main>
      <Footer locale={locale} routes={routes} t={t} />
    </div>
  );
}
