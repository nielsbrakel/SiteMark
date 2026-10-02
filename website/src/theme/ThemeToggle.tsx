import { useEffect, useState } from 'react';
import type { Theme } from '@/core/model/schema';
import { Segmented } from '@/ui/components/Segmented';
import { themeOptions } from '@/ui/components/theme-options';
import type { PageProps } from '../pages/page-props';
import { saveThemeChoice } from './bootstrap';
import styles from './ThemeToggle.module.css';
import { applyThemeChoice, readThemeChoice } from './theme-choice';

type ThemeToggleProps = { t: PageProps['t'] };

/**
 * System / light / dark as three icons, the same switch as the extension's (REQ-WEBUX-002). The
 * server renders System; after hydration the toggle shows what the bootstrap applied. CSS hides it
 * until <html data-js>, so without JavaScript the OS decides.
 */
export function ThemeToggle({ t }: ThemeToggleProps) {
  const [current, setCurrent] = useState<Theme>('system');
  useEffect(() => setCurrent(readThemeChoice(document.documentElement)), []);

  const choose = (choice: Theme) => {
    applyThemeChoice(document.documentElement, choice);
    saveThemeChoice(choice);
    setCurrent(choice);
  };

  return (
    <Segmented
      labelHidden
      className={styles.toggle}
      label={t('websiteThemeLabel')}
      options={themeOptions({
        system: t('themeSystem'),
        light: t('themeLight'),
        dark: t('themeDark'),
      })}
      value={current}
      onChange={choose}
    />
  );
}
