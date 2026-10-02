import { type ReactNode, useId, useState } from 'react';
import { browser } from 'wxt/browser';
import type { SiteMarkState } from '@/core/model/schema';
import { t } from '@/lib/i18n/browser-source';
import { Button } from '@/ui/components/Button';
import { Switch } from '@/ui/components/Switch';
import { diagnosticsText } from './diagnostics';
import styles from './Pane.module.css';

/** Builds the diagnostics with the live grants and puts them on the local clipboard only. */
async function copyDiagnostics(state: SiteMarkState, includeOrigins: boolean): Promise<boolean> {
  try {
    const { origins = [] } = await browser.permissions.getAll();
    const text = diagnosticsText({
      state,
      version: browser.runtime.getManifest().version,
      userAgent: navigator.userAgent,
      granted: new Set(origins),
      includeOrigins,
    });
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Copy diagnostics (REQ-OPT-007) for a bug report. */
export function DiagnosticsSection({ state }: { readonly state: SiteMarkState }): ReactNode {
  const headingId = useId();
  const [result, setResult] = useState<boolean>();
  const [includeOrigins, setIncludeOrigins] = useState(false);
  const copy = async () => setResult(await copyDiagnostics(state, includeOrigins));
  return (
    <section className={styles.pane} aria-labelledby={headingId}>
      <h3 id={headingId}>{t('optionsDiagnostics')}</h3>
      <p>{t('optionsDiagnosticsHelp')}</p>
      <Switch
        label={t('optionsDiagnosticsIncludeOrigins')}
        checked={includeOrigins}
        onChange={setIncludeOrigins}
      />
      <div>
        <Button onClick={() => void copy()}>{t('optionsCopyDiagnostics')}</Button>
      </div>
      <p role="status">
        {result === undefined ? '' : t(result ? 'optionsDiagnosticsCopied' : 'optionsCopyFailed')}
      </p>
    </section>
  );
}
