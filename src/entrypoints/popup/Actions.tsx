import type { ReactNode } from 'react';
import type { TabStatus } from '@/core/render/status';
import { t } from '@/lib/i18n/browser-source';
import { sendToBackground } from '@/platform/send-message';
import { Button } from '@/ui/components/Button';
import { Keys } from '@/ui/components/Keys';
import { HelpTip } from '@/ui/HelpTip';
import styles from './Actions.module.css';
import { useShortcuts } from './use-shortcuts';

export type ActionsProps = {
  readonly tabId: number;
  /** The marker's report; without one there is nothing to hide. */
  readonly status: TabStatus | undefined;
  /** Starts the picker; left out where SiteMark can't run (REQ-POP-005). */
  readonly onPick?: (() => void) | undefined;
  /** Called once the marker was told to hide or show its marks. */
  readonly onToggled?: () => void;
};

/** Pick element and Hide on this tab, with their shortcuts (REQ-POP-003, design.md §5.1 A). */
export function Actions({ tabId, status, onPick, onToggled }: ActionsProps): ReactNode {
  const shortcuts = useShortcuts();
  // One line of key caps; a command without a shortcut, or picking where it can't run, is left out.
  const hints = [
    [onPick && shortcuts['start-picker'], 'popupShortcutPick'],
    [shortcuts['toggle-hide'], 'popupShortcutHide'],
  ] as const;
  const shown = hints.flatMap(([shortcut, label]) => (shortcut ? [{ shortcut, label }] : []));
  const toggleHidden = () => {
    // "Hide on this tab" lives in the marker (D-207); the background flips it (REQ-RND-008).
    void sendToBackground('toggleHidden', { tabId }).then(() => onToggled?.());
  };
  return (
    <div className={styles.actions}>
      <Button disabled={!onPick} onClick={onPick}>
        {t('popupPickElement')}
      </Button>
      <HelpTip topic="picking-an-element" text="helpPickLead" link="helpPickLink" />
      <Button aria-pressed={status?.hidden ?? false} disabled={!status} onClick={toggleHidden}>
        {t('popupHide')}
      </Button>
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
