import { type ReactNode, useId } from 'react';
import type { SiteMarkState, Theme } from '@/core/model/schema';
import { t } from '@/lib/i18n/browser-source';
import { Segmented } from '@/ui/components/Segmented';
import { commandErrorText } from './command-error';
import { DiagnosticsSection } from './DiagnosticsSection';
import type { Notify } from './notify';
import styles from './Pane.module.css';
import { ShortcutList } from './ShortcutList';
import { sendTracked } from './save-status';

export type SettingsPaneProps = {
  readonly state: SiteMarkState;
  readonly notify: Notify;
};

/** Settings (REQ-OPT-004, REQ-OPT-007): theme, shortcuts, title prefix help and diagnostics. */
export function SettingsPane({ state, notify }: SettingsPaneProps): ReactNode {
  const titleId = useId();
  const historyId = useId();
  const themes = [
    { value: 'system', label: t('themeSystem') },
    { value: 'light', label: t('themeLight') },
    { value: 'dark', label: t('themeDark') },
  ] as const;
  const setTheme = async (next: Theme) => {
    const result = await sendTracked({ type: 'setTheme', theme: next });
    if (!result.ok) notify({ text: commandErrorText(result.error) });
  };
  return (
    <section className={styles.pane} aria-labelledby={titleId}>
      <h2 id={titleId} tabIndex={-1}>
        {t('optionsSettings')}
      </h2>
      <Segmented
        label={t('optionsTheme')}
        options={themes}
        value={state.settings.theme}
        onChange={(next) => void setTheme(next)}
      />
      <ShortcutList />
      <section className={styles.pane} aria-labelledby={historyId}>
        <h3 id={historyId}>{t('optionsTitleHistory')}</h3>
        <p>{t('optionsTitleHistoryHelp')}</p>
      </section>
      <DiagnosticsSection state={state} />
    </section>
  );
}
