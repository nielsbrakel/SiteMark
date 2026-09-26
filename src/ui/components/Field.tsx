import { type ReactNode, useId } from 'react';
import { classNames } from './class-names';
import styles from './Field.module.css';
import { WarningIcon } from './icons';

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

function controlProps(id: string, describedBy: string, isInvalid: boolean): FieldControlProps {
  return {
    id,
    className: styles.control ?? '',
    ...(describedBy && { 'aria-describedby': describedBy }),
    ...(isInvalid && { 'aria-invalid': true }),
  };
}

/**
 * A label above a control, helper text and an inline error below it (design.md §4). The control
 * comes from `children`, which receives the id, class and ARIA links to spread onto it.
 */
export function Field({ label, description, error, className, children }: FieldProps): ReactNode {
  const id = useId();
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const describedBy = classNames(description && descriptionId, error && errorId);
  return (
    <div className={classNames(styles.field, className)}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {children(controlProps(id, describedBy, Boolean(error)))}
      {description && (
        <p id={descriptionId} className={styles.description}>
          {description}
        </p>
      )}
      {error && (
        <p id={errorId} className={styles.error}>
          <WarningIcon className={styles.errorIcon} />
          {error}
        </p>
      )}
    </div>
  );
}
