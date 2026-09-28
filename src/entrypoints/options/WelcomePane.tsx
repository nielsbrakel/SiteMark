import { type ReactNode, useId } from 'react';
import { t } from '@/lib/i18n/browser-source';
import styles from './Pane.module.css';
import { useShortcuts } from './use-shortcut';

function ShortcutHint(): ReactNode {
  const shortcuts = useShortcuts();
  if (!shortcuts) return null;
  const shortcut = shortcuts.get('start-picker');
  return <p>{shortcut ? t('welcomeShortcut', shortcut) : t('welcomeShortcutUnset')}</p>;
}

/** The welcome tab the background opens on install (REQ-OPT-001): 3 steps, pinning, the shortcut. */
export function WelcomePane(): ReactNode {
  const stepsId = useId();
  return (
    <section className={styles.pane} aria-labelledby={`${stepsId}-title`}>
      <h2 id={`${stepsId}-title`} tabIndex={-1}>
        {t('welcomeTitle')}
      </h2>
      <p>{t('welcomeIntro')}</p>
      <h3 id={stepsId}>{t('welcomeSteps')}</h3>
      <ol aria-labelledby={stepsId} className={styles.steps}>
        <li>{t('welcomeStepOpen')}</li>
        <li>{t('welcomeStepMark')}</li>
        <li>{t('welcomeStepAllow')}</li>
      </ol>
      <p className="sm-well">{t('welcomePin')}</p>
      <ShortcutHint />
    </section>
  );
}
