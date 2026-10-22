import { type DragEvent, type ReactNode, useState } from 'react';
import styles from './DropZone.module.css';
import type { FieldControlProps } from './Field';
import { ArrowDownIcon, ArrowUpIcon } from './icons';

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

const carriesFiles = (event: DragEvent) => event.dataTransfer.types.includes('Files');

/** A dashed slot for a file: drop it, or click or press Enter to choose one (design.md §4). */
export function DropZone({
  control,
  accept,
  dropText,
  dragText,
  hint,
  onFile,
}: DropZoneProps): ReactNode {
  const [dragging, setDragging] = useState(false);
  const Arrow = dragging ? ArrowDownIcon : ArrowUpIcon;
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: dropping is a pointer shortcut; the file input inside is the keyboard path
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: same
    <div
      className={styles.zone}
      data-dragging={dragging || undefined}
      data-invalid={control['aria-invalid']}
      onDragEnter={(event) => carriesFiles(event) && setDragging(true)}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        const file = event.dataTransfer.files[0];
        if (file) onFile(file);
      }}
    >
      <input
        {...control}
        className={styles.input}
        type="file"
        accept={accept}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
        }}
      />
      <Arrow className={styles.icon} />
      <strong>{dragging ? dragText : dropText}</strong>
      <span className={styles.hint}>{dragging ? '' : hint}</span>
    </div>
  );
}
