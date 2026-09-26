import { type ReactNode, useId } from 'react';
import { classNames } from './class-names';
import styles from './Slider.module.css';

export type SliderProps = {
  readonly label: string;
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly step?: number;
  readonly onChange: (value: number) => void;
  /** The shown value and `aria-valuetext`, e.g. `8 %` (already translated). */
  readonly formatValue?: (value: number) => string;
  readonly disabled?: boolean;
  readonly className?: string;
};

/** A native range input with its label and the current value (design.md §4); keyboard steps are native. */
export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  formatValue,
  disabled,
  className,
}: SliderProps): ReactNode {
  const id = useId();
  const text = formatValue ? formatValue(value) : String(value);
  return (
    <div className={classNames(styles.slider, className)}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <output htmlFor={id} className={styles.value}>
        {text}
      </output>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-valuetext={formatValue ? text : undefined}
        className={styles.input}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    </div>
  );
}
