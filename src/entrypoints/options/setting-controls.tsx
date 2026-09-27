import type { ReactNode } from 'react';
import type { ElementEffects, PageEffects } from '@/core/model/schema';
import { type MessageKey, t } from '@/lib/i18n/browser-source';
import { Segmented } from '@/ui/components/Segmented';
import { Slider } from '@/ui/components/Slider';

// Small building blocks of the effect settings (REQ-OPT-003): a translated segmented choice and a
// slider with its unit.

/** Every effect a mark can have, with its settings; each effect component picks its own. */
export type Effects = PageEffects & ElementEffects;

/** Saves an effect's new settings. */
export type SetEffect<V> = (value: V) => void;

export const px = (value: number): string => t('unitPx', String(value));
export const pct = (value: number): string => t('unitPct', String(value));

export function Choice<V extends string>(props: {
  readonly label: MessageKey;
  readonly options: readonly (readonly [V, MessageKey])[];
  readonly value: V;
  readonly onChange: (value: V) => void;
}): ReactNode {
  const options = props.options.map(([value, label]) => ({ value, label: t(label) }));
  return (
    <Segmented
      label={t(props.label)}
      options={options}
      value={props.value}
      onChange={props.onChange}
    />
  );
}

export function Range(props: {
  readonly label: MessageKey;
  readonly range: readonly [number, number];
  readonly value: number;
  readonly unit: (value: number) => string;
  readonly onChange: (value: number) => void;
}): ReactNode {
  const [min, max] = props.range;
  return (
    <Slider
      label={t(props.label)}
      min={min}
      max={max}
      value={props.value}
      formatValue={props.unit}
      onChange={props.onChange}
    />
  );
}
