import type { ReactNode } from 'react';
import type { Hex } from '../../core/model/schema';
import { notImplemented } from '../../core/not-implemented';

export type ColorChipProps = {
  readonly color: Hex;
  /** Names the color for assistive technology; without it the chip is decorative. */
  readonly label?: string;
  readonly className?: string;
};

export function ColorChip(_props: ColorChipProps): ReactNode {
  return notImplemented();
}
