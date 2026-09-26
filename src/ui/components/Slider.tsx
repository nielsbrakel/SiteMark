import type { ReactNode } from 'react';
import { notImplemented } from '../../core/not-implemented';

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

export function Slider(_props: SliderProps): ReactNode {
  return notImplemented();
}
