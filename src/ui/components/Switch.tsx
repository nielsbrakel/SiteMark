import type { ReactNode } from 'react';
import { notImplemented } from '../../core/not-implemented';

export type SwitchProps = {
  readonly label: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  /** Keeps the label as the accessible name but hides it visually (it is shown elsewhere). */
  readonly labelHidden?: boolean;
  readonly description?: string;
  readonly disabled?: boolean;
  readonly className?: string;
};

export function Switch(_props: SwitchProps): ReactNode {
  return notImplemented();
}
