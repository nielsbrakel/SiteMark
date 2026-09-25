import { type Locale, websiteLocales } from '../i18n/locales';
import type { WebsiteMessageKey } from '../i18n/website-t';
import type { PageProps } from '../pages/page-props';
import type { Route } from '../routes/routes';
import { routePath } from '../routes/urls';
import styles from './LanguageSwitch.module.css';

type LanguageSwitchProps = { route: Route; locale: Locale; t: PageProps['t'] };

/** Each language's own name for itself. */
const NAMES: Record<Locale, WebsiteMessageKey> = {
  en: 'websiteLanguageNameEn',
  nl: 'websiteLanguageNameNl',
};

/**
 * EN / NL links to the same page in each language (REQ-WEBUX-004). Plain links, so it works
 * without JavaScript, and never a redirect by browser language (D-255).
 */
export function LanguageSwitch({ route, locale, t }: LanguageSwitchProps) {
  return (
    <nav aria-label={t('websiteLanguageLabel')}>
      <ul className={styles.list}>
        {websiteLocales().map((other) => (
          <li key={other}>
            <a
              className={styles.link}
              href={routePath(route, other)}
              hrefLang={other}
              lang={other}
              aria-current={other === locale ? 'page' : undefined}
            >
              <span aria-hidden="true">{other.toUpperCase()}</span>
              <span className="sm-visually-hidden">{t(NAMES[other])}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
