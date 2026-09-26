import { repositoryFileUrl, repositoryUrl } from '../config/repository';
import type { Locale } from '../i18n/locales';
import type { PageProps } from '../pages/page-props';
import type { PageId, Route } from '../routes/routes';
import { assetUrl, routePath } from '../routes/urls';
import { ExternalLink } from './ExternalLink';
import styles from './Footer.module.css';
import { pageLabel } from './page-labels';

type FooterProps = { locale: Locale; routes: readonly Route[]; t: PageProps['t'] };

/** The pages the footer links, in this order, once they have a page. */
const FOOTER_PAGES: readonly PageId[] = ['changelog', 'privacy', 'support'];

/** Repository, changelog, privacy, support, sitemap (REQ-SEO-003) and license (REQ-PAGE-007). */
export function Footer({ locale, routes, t }: FooterProps) {
  const pages = FOOTER_PAGES.flatMap((page) => routes.filter((route) => route.page === page));
  return (
    <footer className={styles.footer}>
      <nav aria-label={t('websiteFooterLabel')}>
        <ul className={styles.list}>
          <li>
            <ExternalLink className={styles.link} href={repositoryUrl()}>
              {t('websiteFooterGitHub')}
            </ExternalLink>
          </li>
          {pages.map((route) => (
            <li key={route.page}>
              <a className={styles.link} href={routePath(route, locale)}>
                {t(pageLabel(route.page))}
              </a>
            </li>
          ))}
          <li>
            <a className={styles.link} href={assetUrl('sitemap.xml')}>
              {t('websiteFooterSitemap')}
            </a>
          </li>
          <li>
            <ExternalLink className={styles.link} href={repositoryFileUrl('LICENSE')}>
              {t('websiteFooterLicense')}
            </ExternalLink>
          </li>
        </ul>
      </nav>
      <p className={styles.note}>{t('websiteFooterMadeIn')}</p>
    </footer>
  );
}
