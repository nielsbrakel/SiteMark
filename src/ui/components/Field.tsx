import type { ReactNode } from 'react';
import { notImplemented } from '../../core/not-implemented';

/** Spread onto the input, select or textarea that the field renders. */
export type FieldControlProps = {
  readonly id: string;
  readonly className: string;
  readonly 'aria-describedby'?: string;
  readonly 'aria-invalid'?: true;
};

export type FieldProps = {
  readonly label: string;
  readonly description?: string;
  /** An inline error, already translated; marks the control invalid. */
  readonly error?: string;
  readonly className?: string;
  readonly children: (control: FieldControlProps) => ReactNode;
};

export function Field(_props: FieldProps): ReactNode {
  return notImplemented();
}
