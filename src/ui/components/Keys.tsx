import type { ReactNode } from 'react';
import styles from './Keys.module.css';

export type KeysProps = {
  /** The shortcut as the browser reports it: `Alt+Shift+M`, or `⌥⇧M` on macOS. */
  readonly shortcut: string;
  /** Smaller and muted, for a hint next to the controls. */
  readonly small?: boolean;
};

/** A keyboard shortcut as one key cap per key. */
export function Keys({ shortcut, small = false }: KeysProps): ReactNode {
  const keys = shortcut.includes('+') ? shortcut.split('+') : Array.from(shortcut);
  return (
    <span className={styles.keys} data-small={small || undefined}>
      {keys.map((key, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: the keys of one shortcut never move.
        <kbd key={index} className={styles.key}>
          {key}
        </kbd>
      ))}
    </span>
  );
}
