import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { notImplemented } from '../../core/not-implemented';

export type IconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'style' | 'type' | 'children' | 'aria-label' | 'title'
> & {
  /** Required accessible name, also shown as the tooltip. */
  readonly label: string;
  readonly icon: ReactNode;
};

export function IconButton(_props: IconButtonProps): ReactNode {
  return notImplemented();
}
