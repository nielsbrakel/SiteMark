import type { ReactNode } from 'react';
import { notImplemented } from '../../core/not-implemented';

export type SegmentedOption<V extends string> = {
  readonly value: V;
  readonly label: string;
};

export type SegmentedProps<V extends string> = {
  readonly label: string;
  readonly options: readonly SegmentedOption<V>[];
  readonly value: V;
  readonly onChange: (value: V) => void;
  readonly disabled?: boolean;
  readonly className?: string;
};

export function Segmented<V extends string>(_props: SegmentedProps<V>): ReactNode {
  return notImplemented();
}
