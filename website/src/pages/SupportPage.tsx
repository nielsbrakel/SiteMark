// biome-ignore-all lint/security/noSecrets: i18n message keys, not secrets
import { Callout } from '../components/Callout';
import { ExternalLink } from '../components/ExternalLink';
import { contactUrls } from '../config/contact';
import type { PageProps } from './page-props';
import styles from './SupportPage.module.css';
import { BUG_REPORT_ITEMS, CONTACT_ROUTES, FAQ } from './support-content';

type Props = Pick<PageProps, 't'>;

function ContactRoutes({ t }: Props) {
  const urls = contactUrls();
  return (
    <ul className={styles.routes}>
      {CONTACT_ROUTES.map(({ url, link, text }) => (
        <li key={url} className={styles.route}>
          <ExternalLink className={styles.routeLink} href={urls[url]}>
            {t(link)}
          </ExternalLink>
          <p>{t(text)}</p>
        </li>
      ))}
    </ul>
  );
}

function SecurityCallout({ t }: Props) {
  return (
    <Callout title={t('websiteSupportCalloutTitle')}>
      <p>{t('websiteSupportCalloutText')}</p>
      <p>
        <ExternalLink href={contactUrls().securityPolicy}>
          {t('websiteSupportSecurityPolicyLink')}
        </ExternalLink>
      </p>
    </Callout>
  );
}

function Faq({ t }: Props) {
  return (
    <>
      <h2>{t('websiteFaqHeading')}</h2>
      {FAQ.map(({ question, answer }) => (
        <section key={question} className={styles.question}>
          <h3>{t(question)}</h3>
          <p>{t(answer)}</p>
        </section>
      ))}
    </>
  );
}

/**
 * Support & contact (REQ-PAGE-003): GitHub Issues and private vulnerability reporting (D-248),
 * a security warning, the FAQ, what a bug report needs and how fast answers come.
 */
export function SupportPage({ t }: PageProps) {
  return (
    <div className={styles.page}>
      <h1>{t('websiteSupportHeading')}</h1>
      <p className={styles.lead}>{t('websiteSupportLead')}</p>
      <SecurityCallout t={t} />
      <h2>{t('websiteSupportContactHeading')}</h2>
      <ContactRoutes t={t} />
      <Faq t={t} />
      <h2>{t('websiteBugReportHeading')}</h2>
      <ul>
        {BUG_REPORT_ITEMS.map((item) => (
          <li key={item}>{t(item)}</li>
        ))}
      </ul>
    </div>
  );
}
