import { type ReactNode, useId } from 'react';
import type { TabStatus } from '@/core/render/status';
import { t } from '@/lib/i18n/browser-source';
import { sendToBackground } from '@/platform/send-message';
import { Button } from '@/ui/components/Button';
import styles from './Actions.module.css';
import { startPicker } from './start-picker';
import type { Shortcuts } from './use-shortcuts';

export type ActionsProps = {
  readonly tabId: number;
  /** The marker's report; without one there is nothing to hide. */
  readonly status: TabStatus | undefined;
  readonly shortcuts: Shortcuts;
  /** Called once the marker was told to hide or show its marks. */
  readonly onToggled: () => void;
};

/** Pick element and Hide on this tab, with their shortcuts (REQ-POP-003, design.md §5.1 A). */
export function Actions({ tabId, status, shortcuts, onToggled }: ActionsProps): ReactNode {
  const hideShortcutId = useId();
  const hideShortcut = shortcuts['toggle-hide'];
  const pickShortcut = shortcuts['start-picker'];
  const toggleHidden = () => {
    // "Hide on this tab" lives in the marker (D-207); the background flips it (REQ-RND-008).
    void sendToBackground('toggleHidden', { tabId }).then(onToggled);
  };
  return (
    <div className={styles.actions}>
      <Button onClick={() => void startPicker(tabId)}>{t('popupPickElement')}</Button>
      <Button
        aria-pressed={status?.hidden ?? false}
        aria-describedby={hideShortcut ? hideShortcutId : undefined}
        disabled={!status}
        onClick={toggleHidden}
      >
        {t('popupHide')}
      </Button>
      {hideShortcut && (
        <p id={hideShortcutId} className={styles.hint}>
          {t('popupShortcut', hideShortcut)}
        </p>
      )}
      {pickShortcut && <p className={styles.hint}>{t('popupPickShortcut', pickShortcut)}</p>}
    </div>
  );
}
