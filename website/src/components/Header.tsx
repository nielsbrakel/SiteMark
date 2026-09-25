import wordmarkLight from '../../../design/logo/sitemark-wordmark.svg';
import wordmarkDark from '../../../design/logo/sitemark-wordmark-dark.svg';
import type { Locale } from '../i18n/locales';
import type { PageProps } from '../pages/page-props';
import type { Route } from '../routes/routes';
import { routePath } from '../routes/urls';
import styles from './Header.module.css';
import { LanguageSwitch } from './LanguageSwitch';
import { pageLabel } from './page-labels';

type HeaderProps = { route: Route; locale: Locale; routes: readonly Route[]; t: PageProps['t'] };

// The wordmark SVG is 520 × 128; width and height avoid layout shift (REQ-WEB-007).
const WORDMARK = { width: 130, height: 32 } as const;
const HOME = { slug: '' };

const current = (isCurrent: boolean) => (isCurrent ? 'page' : undefined);

function Wordmark({ route, locale, t }: Omit<HeaderProps, 'routes'>) {
  // Both variants are in the HTML and CSS fades in the one that matches the theme (design §5). The
  // light one stays in the accessibility tree in every theme, so it alone carries the link text.
  return (
    <a
      className={styles.home}
      href={routePath(HOME, locale)}
      aria-current={current(route.page === 'home')}
    >
      <img
        className={styles.light}
        src={wordmarkLight}
        alt={t('websiteHeaderHome')}
        {...WORDMARK}
      />
      <img className={styles.dark} src={wordmarkDark} alt="" {...WORDMARK} />
    </a>
  );
}

function Navigation({ route, locale, routes, t }: HeaderProps) {
  const items = routes.filter((r) => r.nav);
  if (!items.length) return null;
  return (
    <nav className={styles.nav} aria-label={t('websiteNavLabel')}>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.page}>
            <a
              className={styles.link}
              href={routePath(item, locale)}
              aria-current={current(item.page === route.page)}
            >
              {t(pageLabel(item.page))}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** The wordmark (links home), the navigation and the language switch (REQ-PAGE-007). */
export function Header(props: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.bar}>
        <Wordmark route={props.route} locale={props.locale} t={props.t} />
        <Navigation {...props} />
        <div className={styles.tools}>
          <LanguageSwitch route={props.route} locale={props.locale} t={props.t} />
        </div>
      </div>
    </header>
  );
}
