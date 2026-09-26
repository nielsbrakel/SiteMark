import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { notImplemented } from '../../core/not-implemented';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet';

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style' | 'type'> & {
  /** `primary` = accent fill, `secondary` = raised surface (default), `quiet` = no chrome. */
  readonly variant?: ButtonVariant;
  /** A decorative icon before the label (hidden from assistive technology). */
  readonly icon?: ReactNode;
  readonly type?: 'button' | 'submit';
};

export function Button(_props: ButtonProps): ReactNode {
  return notImplemented();
}
