import { type ReactNode, useId } from 'react';
import { t } from '@/lib/i18n/browser-source';
import styles from './Pane.module.css';
import { useShortcut } from './use-shortcut';

function ShortcutHint(): ReactNode {
  const state = useShortcut('start-picker');
  if ('status' in state) return null;
  return <p>{state.shortcut ? t('welcomeShortcut', state.shortcut) : t('welcomeShortcutUnset')}</p>;
}

/** The welcome tab the background opens on install (REQ-OPT-001): 3 steps, pinning, the shortcut. */
export function WelcomePane(): ReactNode {
  const stepsId = useId();
  return (
    <section className={styles.pane} aria-labelledby={`${stepsId}-title`}>
      <h2 id={`${stepsId}-title`}>{t('welcomeTitle')}</h2>
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
