import type { ReactNode } from 'react';
import styles from './Callout.module.css';

type CalloutProps = { title: string; children: ReactNode };

/** A warning box (design §4): an icon, a bold title and text, so color is never the only cue. */
export function Callout({ title, children }: CalloutProps) {
  return (
    <div className={styles.callout} role="note">
      <svg className={styles.icon} viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
        <path d="M12 3 2 21h20L12 3Z" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M12 10v5M12 17.5v.5" stroke="currentColor" strokeWidth="2" />
      </svg>
      <div>
        <p className={styles.title}>{title}</p>
        {children}
      </div>
    </div>
  );
}
