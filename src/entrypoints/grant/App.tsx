import { type ReactNode, useState } from 'react';
import logo from '@/assets/logo.svg';
import type { OriginPattern } from '@/core/url/origin';
import { type MessageKey, t } from '@/lib/i18n/browser-source';
import { grantPageOrigins } from '@/platform/grant-page';
import { type RequestOutcome, requestOrigins } from '@/platform/permissions';
import styles from './App.module.css';

export type GrantAppProps = {
  /** `location.search` of the page: `?origins=…` (src/platform/grant-page.ts). */
  readonly search: string;
};

const OUTCOME_MESSAGES: Record<RequestOutcome, MessageKey> = {
  granted: 'grantGranted',
  denied: 'grantDenied',
  failed: 'grantFailed',
};

function Sites({ origins }: { readonly origins: readonly OriginPattern[] }) {
  return (
    <ul className={styles.sites} aria-label={t('grantSites')}>
      {origins.map((origin) => (
        <li key={origin}>
          <code>{origin}</code>
        </li>
      ))}
    </ul>
  );
}

function Request({ origins }: { readonly origins: readonly OriginPattern[] }) {
  const [outcome, setOutcome] = useState<RequestOutcome>();
  const allow = () => {
    // D-229: prompt first, synchronously inside the click; nothing may run or be awaited before it.
    const pending = requestOrigins(origins);
    setOutcome(undefined);
    void pending.then(setOutcome);
  };
  return (
    <>
      <p>{t('grantExplanation')}</p>
      <Sites origins={origins} />
      {outcome !== 'granted' && (
        <button type="button" className="sm-button sm-button--primary" onClick={allow}>
          {t('grantAllow')}
        </button>
      )}
      {outcome && <p role="status">{t(OUTCOME_MESSAGES[outcome])}</p>}
    </>
  );
}

/** The grant page (D-229): asks for the sites in its link, on one Allow click. */
export function GrantApp({ search }: GrantAppProps): ReactNode {
  const origins = grantPageOrigins(search);
  return (
    <main className={`sm-card ${styles.page}`}>
      <header className={styles.header}>
        <img src={logo} alt="" width={32} height={32} />
        <h1>{t('grantTitle')}</h1>
      </header>
      {origins ? <Request origins={origins} /> : <p role="alert">{t('grantInvalid')}</p>}
    </main>
  );
}
