import { classNames } from '@/ui/components/class-names';
import { repositoryUrl } from '../config/repository';
import type { Locale } from '../i18n/locales';
import { Island } from '../islands/islands';
import type { PageProps } from '../pages/page-props';
import type { Route } from '../routes/routes';
import { routePath } from '../routes/urls';
import { ExternalLink } from './ExternalLink';
import { GitHubIcon } from './GitHubIcon';
import styles from './Header.module.css';
import { LanguageSwitch } from './LanguageSwitch';
import { pageLabel } from './page-labels';
import { LETTERING } from './wordmark-lettering';

type HeaderProps = { route: Route; locale: Locale; routes: readonly Route[]; t: PageProps['t'] };

// The wordmark is 510 × 128; width and height avoid layout shift (REQ-WEB-007).
const WORDMARK = { width: 175, height: 44 } as const;
const HOME = { slug: '' };

const current = (isCurrent: boolean) => (isCurrent ? 'page' : undefined);

/** A help topic page belongs to Help in the navigation. */
const isHelpTopicOf = (item: Route, route: Route) =>
  item.page === 'help' && route.page === 'helpTopic';

function Wordmark({ route, locale, t }: Omit<HeaderProps, 'routes'>) {
  // Inline, not an <img>: Firefox shares one document per cached SVG image, so an animation inside
  // it played on the first page only. Here it starts with every page. The colors follow the theme
  // through CSS, so there is one drawing for both (design/logo has the standalone files).
  return (
    <a
      className={styles.home}
      href={routePath(HOME, locale)}
      aria-current={current(route.page === 'home')}
    >
      <svg
        className={styles.logo}
        viewBox="10 0 510 128"
        role="img"
        aria-label={t('websiteHeaderHome')}
        {...WORDMARK}
      >
        <g transform="translate(4 8) scale(.88)">
          <g className={styles.win}>
            <defs>
              <clipPath id="wordmark-window">
                <rect x="16" y="20" width="96" height="88" rx="12" />
              </clipPath>
            </defs>
            <rect className={styles.edge} x="16" y="20" width="96" height="88" rx="12" />
            <rect className={styles.face} x="16" y="20" width="96" height="88" rx="12" />
            <path className={styles.ink} d="M16 46H112" strokeWidth="6" />
            <circle className={styles.dot} cx="30" cy="33" r="3.6" />
            <g clipPath="url(#wordmark-window)">
              <path className={styles.rib} d="M44 10L84 10L124 50L124 90Z" />
            </g>
            <rect className={styles.frame} x="16" y="20" width="96" height="88" rx="12" />
          </g>
        </g>
        <g transform="translate(0 9)">
          <path className={styles.site} d={LETTERING.site} />
          <path className={styles.mark} d={LETTERING.mark} />
        </g>
      </svg>
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
              className={classNames('sm-nav-link', styles.link)}
              href={routePath(item, locale)}
              aria-current={current(item.page === route.page || isHelpTopicOf(item, route))}
            >
              {t(pageLabel(item.page))}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** The wordmark, the navigation, the language switch, the theme toggle and the GitHub icon. */
export function Header(props: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.bar}>
        <Wordmark route={props.route} locale={props.locale} t={props.t} />
        <Navigation {...props} />
        <div className={styles.tools}>
          <LanguageSwitch route={props.route} locale={props.locale} t={props.t} />
          <Island id="themeToggle" t={props.t} />
          <ExternalLink className={styles.github} href={repositoryUrl()}>
            <GitHubIcon />
            <span className="sm-visually-hidden">{props.t('websiteNavGitHub')}</span>
          </ExternalLink>
        </div>
      </div>
    </header>
  );
}
