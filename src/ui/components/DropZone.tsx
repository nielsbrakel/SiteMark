import type { ReactNode } from 'react';
import { notImplemented } from '@/core/not-implemented';
import type { FieldControlProps } from './Field';

export type DropZoneProps = {
  /** From the enclosing Field: the id, ARIA links and invalid flag of the file input. */
  readonly control: FieldControlProps;
  /** The file types the picker offers (`accept` of the input). */
  readonly accept: string;
  /** Idle prompt, the text shown while a file is dragged over, and the "or choose" hint. */
  readonly dropText: string;
  readonly dragText: string;
  readonly hint: string;
  readonly onFile: (file: File) => void;
};

/** A dashed slot for a file: drop it, or click or press Enter to choose one (design.md §4). */
export function DropZone(_props: DropZoneProps): ReactNode {
  return notImplemented();
}
