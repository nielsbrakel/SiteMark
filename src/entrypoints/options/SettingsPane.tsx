import { type ReactNode, useId } from 'react';
import type { SiteMarkState } from '@/core/model/schema';
import { t } from '@/lib/i18n/browser-source';
import { DiagnosticsSection } from './DiagnosticsSection';
import styles from './Pane.module.css';
import { ShortcutList } from './ShortcutList';

/** Settings (REQ-OPT-004, REQ-OPT-007): shortcuts, title prefix help and diagnostics. */
export function SettingsPane({ state }: { readonly state: SiteMarkState }): ReactNode {
  const titleId = useId();
  const historyId = useId();
  return (
    <section className={styles.pane} aria-labelledby={titleId}>
      <h2 id={titleId} tabIndex={-1}>
        {t('optionsSettings')}
      </h2>
      <ShortcutList />
      <section className={styles.pane} aria-labelledby={historyId}>
        <h3 id={historyId}>{t('optionsTitleHistory')}</h3>
        <p>{t('optionsTitleHistoryHelp')}</p>
      </section>
      <DiagnosticsSection state={state} />
    </section>
  );
}
