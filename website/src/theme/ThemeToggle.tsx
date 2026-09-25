import { useEffect, useState } from 'react';
import type { WebsiteMessageKey } from '../i18n/website-t';
import type { PageProps } from '../pages/page-props';
import { saveThemeChoice } from './bootstrap';
import styles from './ThemeToggle.module.css';
import { applyThemeChoice, readThemeChoice, type ThemeChoice } from './theme-choice';

type ThemeToggleProps = { t: PageProps['t'] };

const CHOICES: readonly { choice: ThemeChoice; label: WebsiteMessageKey }[] = [
  { choice: 'auto', label: 'websiteThemeAuto' },
  { choice: 'light', label: 'websiteThemeLight' },
  { choice: 'dark', label: 'websiteThemeDark' },
];

/**
 * Auto / Light / Dark (REQ-WEBUX-002). The server renders Auto; after hydration the toggle shows
 * what the bootstrap applied. CSS hides it until <html data-js>, so without JavaScript the OS decides.
 */
export function ThemeToggle({ t }: ThemeToggleProps) {
  const [current, setCurrent] = useState<ThemeChoice>('auto');
  useEffect(() => setCurrent(readThemeChoice(document.documentElement)), []);

  const choose = (choice: ThemeChoice) => {
    applyThemeChoice(document.documentElement, choice);
    saveThemeChoice(choice);
    setCurrent(choice);
  };

  return (
    <fieldset className={styles.toggle}>
      <legend className="sm-visually-hidden">{t('websiteThemeLabel')}</legend>
      {CHOICES.map(({ choice, label }) => (
        <button
          key={choice}
          type="button"
          className={styles.option}
          aria-pressed={choice === current}
          onClick={() => choose(choice)}
        >
          {t(label)}
        </button>
      ))}
    </fieldset>
  );
}
