import { type ReactNode, useId } from 'react';
import { classNames } from './class-names';
import styles from './Switch.module.css';

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

/**
 * An on/off switch (`role="switch"`) with a visible label (design.md §4). On is shown by the accent
 * track and the knob's position, not by shadow alone.
 */
export function Switch({
  label,
  checked,
  onChange,
  labelHidden = false,
  description,
  disabled,
  className,
}: SwitchProps): ReactNode {
  const id = useId();
  const descriptionId = `${id}-description`;
  return (
    <span className={classNames(styles.switch, className)}>
      <label htmlFor={id} className={labelHidden ? 'sm-visually-hidden' : styles.label}>
        {label}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? descriptionId : undefined}
        disabled={disabled}
        className={styles.track}
        onClick={() => onChange(!checked)}
      >
        <span className={styles.knob} />
      </button>
      {description && (
        <span id={descriptionId} className={styles.description}>
          {description}
        </span>
      )}
    </span>
  );
}
