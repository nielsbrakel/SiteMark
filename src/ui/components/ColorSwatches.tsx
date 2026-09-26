import type { ReactNode } from 'react';
import type { Hex } from '../../core/model/schema';
import { notImplemented } from '../../core/not-implemented';

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

export function ColorSwatches(_props: ColorSwatchesProps): ReactNode {
  return notImplemented();
}
