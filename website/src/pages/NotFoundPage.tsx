import { pageLabel } from '../components/page-labels';
import type { Locale } from '../i18n/locales';
import type { PageId, Route } from '../routes/routes';
import { routePath } from '../routes/urls';
import styles from './NotFoundPage.module.css';
import type { PageProps } from './page-props';

type NotFoundPageProps = {
  en: PageProps['t'];
  nl: PageProps['t'];
  /** The routes that have a page: only these are linked. */
  routes: readonly Route[];
};

/** Where a lost visitor can go, once the page exists (help arrives in W2). */
const TARGETS: readonly PageId[] = ['home', 'help', 'support'];

type SectionProps = { locale: Locale; t: PageProps['t']; routes: readonly Route[] };

function NotFoundSection({ locale, t, routes }: SectionProps) {
  const Heading = locale === 'en' ? 'h1' : 'h2';
  const targets = TARGETS.flatMap((page) => routes.filter((route) => route.page === page));
  return (
    <section lang={locale} className={styles.section}>
      <Heading>{t('websiteNotFoundHeading')}</Heading>
      <p>{t('websiteNotFoundText')}</p>
      <ul className={styles.links}>
        {targets.map((route) => (
          <li key={route.page}>
            <a href={routePath(route, locale)}>{t(pageLabel(route.page))}</a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * The bilingual not-found page (REQ-PAGE-006): English and Dutch, each with its links. There is no
 * shell: 404.html answers any unknown path, so no header can know the visitor's language or page.
 */
export function NotFoundPage({ en, nl, routes }: NotFoundPageProps) {
  return (
    <main id="main" className={styles.page}>
      <NotFoundSection locale="en" t={en} routes={routes} />
      <NotFoundSection locale="nl" t={nl} routes={routes} />
    </main>
  );
}
