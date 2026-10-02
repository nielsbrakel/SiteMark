import { type ReactNode, useId } from 'react';
import { classNames } from './class-names';
import { CheckIcon } from './icons';
import { rovingTabIndex, useRovingFocus } from './roving';
import styles from './Segmented.module.css';

export type SegmentedOption<V extends string> = {
  readonly value: V;
  readonly label: string;
  /** Shown instead of the label (which stays the accessible name and tooltip). */
  readonly icon?: ReactNode;
};

export type SegmentedProps<V extends string> = {
  readonly label: string;
  readonly options: readonly SegmentedOption<V>[];
  readonly value: V;
  readonly onChange: (value: V) => void;
  readonly disabled?: boolean;
  /** Keeps `label` as the group's accessible name but hides it visually. */
  readonly labelHidden?: boolean;
  readonly className?: string | undefined;
};

/**
 * A segmented control with radio group semantics (design.md §4): arrow keys, Home and End move the
 * selection. The selected segment is raised and carries a check mark, so it isn't shown by shadow alone;
 * a segment with an icon shows only the icon, and the selected one is pressed in, not raised.
 */
export function Segmented<V extends string>({
  label,
  options,
  value,
  onChange,
  disabled = false,
  labelHidden = false,
  className,
}: SegmentedProps<V>): ReactNode {
  const labelId = useId();
  const selectedIndex = options.findIndex((option) => option.value === value);
  const select = (index: number) => {
    const option = options[index];
    if (option) onChange(option.value);
  };
  const roving = useRovingFocus(options.length, select, disabled);
  return (
    <div className={classNames(styles.segmented, className)}>
      <span id={labelId} className={labelHidden ? 'sm-visually-hidden' : styles.label}>
        {label}
      </span>
      <div role="radiogroup" aria-labelledby={labelId} className={styles.group}>
        {options.map((option, index) => (
          // biome-ignore lint/a11y/useSemanticElements: styled radios with roving focus (APG radio group).
          <button
            key={option.value}
            ref={roving.ref(index)}
            type="button"
            role="radio"
            aria-checked={index === selectedIndex}
            tabIndex={rovingTabIndex(index, selectedIndex)}
            disabled={disabled}
            className={styles.segment}
            title={option.icon ? option.label : undefined}
            aria-label={option.icon ? option.label : undefined}
            onClick={() => select(index)}
            onKeyDown={roving.onKeyDown(index)}
          >
            {option.icon ??
              (index === selectedIndex ? (
                <>
                  <CheckIcon className={styles.check} />
                  {option.label}
                </>
              ) : (
                option.label
              ))}
          </button>
        ))}
      </div>
    </div>
  );
}
