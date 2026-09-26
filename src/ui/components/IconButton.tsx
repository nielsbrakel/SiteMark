import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { classNames } from './class-names';
import styles from './IconButton.module.css';

export type IconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'style' | 'type' | 'children' | 'aria-label' | 'title'
> & {
  /** Required accessible name, also shown as the tooltip. */
  readonly label: string;
  readonly icon: ReactNode;
};

/** A 32 × 32 round button with only an icon; `label` is its name (design.md §4). */
export function IconButton({ label, icon, className, ...rest }: IconButtonProps): ReactNode {
  return (
    <button
      {...rest}
      type="button"
      aria-label={label}
      title={label}
      className={classNames(styles.iconButton, className)}
    >
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
    </button>
  );
}
