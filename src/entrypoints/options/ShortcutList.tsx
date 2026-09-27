import { type ReactNode, useId } from 'react';
import { type MessageKey, t } from '@/lib/i18n/browser-source';
import { openShortcutSettings } from '@/platform/shortcut-settings';
import { Button } from '@/ui/components/Button';
import styles from './Pane.module.css';
import { useShortcuts } from './use-shortcut';

/** The manifest commands in the order they are shown, with their descriptions. */
const COMMANDS: readonly { name: string; label: MessageKey }[] = [
  { name: 'start-picker', label: 'commandStartPicker' },
  { name: 'toggle-hide', label: 'commandToggleHide' },
];

/**
 * The live keyboard shortcuts (REQ-CMD-001, REQ-CMD-002), "Not assigned" where the user has none,
 * and a button to the browser's own shortcut settings, the only place they can change.
 */
export function ShortcutList(): ReactNode {
  const headingId = useId();
  const shortcuts = useShortcuts();
  return (
    <section className={styles.pane} aria-labelledby={headingId}>
      <h3 id={headingId}>{t('optionsShortcuts')}</h3>
      <ul aria-labelledby={headingId} className={styles.shortcuts}>
        {shortcuts &&
          COMMANDS.filter(({ name }) => shortcuts.has(name)).map(({ name, label }) => (
            <li key={name}>
              <span>{t(label)}</span>
              <kbd>{shortcuts.get(name) || t('optionsShortcutUnset')}</kbd>
            </li>
          ))}
      </ul>
      <div>
        <Button onClick={() => void openShortcutSettings()}>{t('optionsChangeShortcuts')}</Button>
      </div>
    </section>
  );
}
