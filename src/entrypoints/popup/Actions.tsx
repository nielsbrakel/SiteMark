import type { ReactNode } from 'react';
import { t } from '@/lib/i18n/browser-source';
import { Button } from '@/ui/components/Button';
import { Keys } from '@/ui/components/Keys';
import { HelpTip } from '@/ui/HelpTip';
import styles from './Actions.module.css';
import { useShortcuts } from './use-shortcuts';

export type ActionsProps = {
  /** Starts the picker; left out where SiteMark can't run (REQ-POP-005). */
  readonly onPick?: (() => void) | undefined;
};

/** Pick element, with the picker's and the hide shortcuts as a hint (REQ-POP-003, design.md §5.1 A). */
export function Actions({ onPick }: ActionsProps): ReactNode {
  const shortcuts = useShortcuts();
  // One line of key caps; a command without a shortcut, or picking where it can't run, is left out.
  const hints = [
    [onPick && shortcuts['start-picker'], 'popupShortcutPick'],
    [shortcuts['toggle-hide'], 'popupShortcutHide'],
  ] as const;
  const shown = hints.flatMap(([shortcut, label]) => (shortcut ? [{ shortcut, label }] : []));
  return (
    <div className={styles.actions}>
      <Button disabled={!onPick} onClick={onPick}>
        {t('popupPickElement')}
      </Button>
      <HelpTip topic="picking-an-element" text="helpPickLead" link="helpPickLink" />
      {shown.length > 0 && (
        <p className={styles.hint}>
          {shown.map(({ shortcut, label }, index) => (
            <span key={label}>
              {index > 0 && ' · '}
              <Keys shortcut={shortcut} small /> {t(label)}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
