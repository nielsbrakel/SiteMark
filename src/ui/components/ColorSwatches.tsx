import { type ReactNode, useId } from 'react';
import { autoTextColor } from '../../core/model/color';
import type { Hex } from '../../core/model/schema';
import styles from './ColorSwatches.module.css';
import { classNames } from './class-names';
import { CheckIcon } from './icons';
import { paintColor } from './paint';
import { rovingTabIndex, useRovingFocus } from './roving';

export type ColorSwatchOption = {
  readonly value: Hex;
  /** The color's name (e.g. "Red"), already translated. */
  readonly label: string;
};

export type ColorSwatchesProps = {
  readonly label: string;
  readonly options: readonly ColorSwatchOption[];
  /** The selected color; a custom color that isn't an option selects no swatch. */
  readonly value: Hex | undefined;
  readonly onChange: (color: Hex) => void;
  readonly disabled?: boolean;
  readonly className?: string;
};

/** Fills a swatch with its color and gives the check mark the contrasting black or white. */
function paintSwatch(element: HTMLElement | null, color: Hex): void {
  paintColor(element, '--sm-swatch-color', color);
  paintColor(element, '--sm-swatch-on', autoTextColor(color));
}

/**
 * Preset color swatches as a radio group (design.md §4, ColorField): 28 px, 8 px apart, each named
 * by its color. The selected one gets a check mark and a ring, so selection isn't color alone.
 */
export function ColorSwatches({
  label,
  options,
  value,
  onChange,
  disabled = false,
  className,
}: ColorSwatchesProps): ReactNode {
  const labelId = useId();
  const selectedIndex = options.findIndex((option) => option.value === value);
  const select = (index: number) => {
    const option = options[index];
    if (option) onChange(option.value);
  };
  const roving = useRovingFocus(options.length, select, disabled);
  return (
    <div className={classNames(styles.colorSwatches, className)}>
      <span id={labelId} className={styles.label}>
        {label}
      </span>
      <div role="radiogroup" aria-labelledby={labelId} className={styles.group}>
        {options.map((option, index) => (
          // biome-ignore lint/a11y/useSemanticElements: styled radios with roving focus (APG radio group).
          <button
            key={option.value}
            ref={(element) => {
              roving.ref(index)(element);
              paintSwatch(element, option.value);
            }}
            type="button"
            role="radio"
            aria-checked={index === selectedIndex}
            aria-label={option.label}
            title={option.label}
            tabIndex={rovingTabIndex(index, selectedIndex)}
            disabled={disabled}
            className={styles.swatch}
            onClick={() => select(index)}
            onKeyDown={roving.onKeyDown(index)}
          >
            {index === selectedIndex && <CheckIcon />}
          </button>
        ))}
      </div>
    </div>
  );
}
