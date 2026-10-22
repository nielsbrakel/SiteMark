// biome-ignore-all lint/security/noSecrets: i18n message keys, not secrets
import { Callout } from '../components/Callout';
import { ExternalLink } from '../components/ExternalLink';
import { contactUrls } from '../config/contact';
import styles from './HelpPage.module.css';
import type { PageProps } from './page-props';
import { BUG_REPORT_ITEMS, CONTACT_ROUTES } from './support-content';

/**
 * "Still stuck?" at the bottom of the help page (REQ-PAGE-003): the GitHub routes as taped notes
 * (D-248), a security warning and what a bug report needs. Spare-time answer times are set here.
 */
export function ContactBlock({ t }: Pick<PageProps, 't'>) {
  const urls = contactUrls();
  return (
    <section aria-labelledby="contact" className={styles.contact}>
      <h2 id="contact">{t('websiteSupportContactHeading')}</h2>
      <p className={styles.lead}>{t('websiteSupportLead')}</p>
      <ul className={styles.notes}>
        {CONTACT_ROUTES.map(({ url, link, text }) => (
          <li key={url} className={`sm-card sm-tape ${styles.note}`}>
            <h3>
              <ExternalLink className={`sm-link-quiet ${styles.link}`} href={urls[url]}>
                {t(link)}
              </ExternalLink>
            </h3>
            <p>{t(text)}</p>
          </li>
        ))}
      </ul>
      <Callout title={t('websiteSupportCalloutTitle')}>
        <p>{t('websiteSupportCalloutText')}</p>
        <p>
          <ExternalLink className={`sm-link-quiet ${styles.link}`} href={urls.securityPolicy}>
            {t('websiteSupportSecurityPolicyLink')}
          </ExternalLink>
        </p>
      </Callout>
      <h3>{t('websiteBugReportHeading')}</h3>
      <ul>
        {BUG_REPORT_ITEMS.map((item) => (
          <li key={item}>{t(item)}</li>
        ))}
      </ul>
    </section>
  );
}
