import type { ReactNode } from 'react';
import { notImplemented } from '../../core/not-implemented';

export type DialogProps = {
  /** Controlled: the owner opens the dialog and closes it from `onClose`. */
  readonly open: boolean;
  /** Escape, or the browser closing the dialog, asks the owner to close it. */
  readonly onClose: () => void;
  readonly title: string;
  readonly children: ReactNode;
  /** Buttons at the bottom, e.g. Cancel and Delete. */
  readonly actions?: ReactNode;
  readonly className?: string;
};

export function Dialog(_props: DialogProps): ReactNode {
  return notImplemented();
}
