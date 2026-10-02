import type { ReactNode } from 'react';
import type { Theme } from '@/core/model/schema';
import { t } from '@/lib/i18n/browser-source';
import { Segmented } from '@/ui/components/Segmented';
import { themeOptions } from '@/ui/components/theme-options';
import { commandErrorText } from './command-error';
import type { Notify } from './notify';
import { sendTracked } from './save-status';

/** The theme setting (REQ-THEME-001) as the header's icon switch; the background stores it. */
export function ThemeControl({
  theme,
  notify,
}: {
  readonly theme: Theme;
  readonly notify: Notify;
}): ReactNode {
  const change = async (next: Theme) => {
    const result = await sendTracked({ type: 'setTheme', theme: next });
    if (!result.ok) notify({ text: commandErrorText(result.error) });
  };
  return (
    <Segmented
      labelHidden
      label={t('optionsTheme')}
      options={themeOptions({
        system: t('themeSystem'),
        light: t('themeLight'),
        dark: t('themeDark'),
      })}
      value={theme}
      onChange={(next) => void change(next)}
    />
  );
}
