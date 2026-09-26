import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';
import { classNames } from './class-names';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet';

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style' | 'type'> & {
  /** `primary` = accent fill, `secondary` = raised surface (default), `quiet` = no chrome. */
  readonly variant?: ButtonVariant;
  /** A decorative icon before the label (hidden from assistive technology). */
  readonly icon?: ReactNode;
  readonly type?: 'button' | 'submit';
};

/** A labelled button (design.md §4). Never submits a form unless `type="submit"`. */
export function Button({
  variant = 'secondary',
  icon,
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps): ReactNode {
  return (
    <button
      {...rest}
      type={type}
      data-variant={variant}
      className={classNames(styles.button, className)}
    >
      {icon && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </button>
  );
}
