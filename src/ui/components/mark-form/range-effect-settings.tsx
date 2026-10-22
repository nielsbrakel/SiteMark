import type { ReactNode } from 'react';
import type { ElementEffects, PageEffects } from '@/core/model/schema';
import { Switch } from '../Switch';
import { RANGES, type TargetKind } from './effect-catalog';
import styles from './MarkForm.module.css';
import { Choice, type Effects, Range, type SetEffect } from './setting-controls';
import { useT } from './translate';

// Settings of the effects without text: frame, tint, stripes and outline, with the ranges of
// spec §7 (tint's depends on the target).

export function FrameSettings({
  value,
  set,
}: {
  readonly value: NonNullable<Effects['frame']>;
  readonly set: SetEffect<typeof value>;
}): ReactNode {
  return (
    <Range
      label="optionsFrameWidth"
      range={RANGES.frame}
      value={value.widthPx}
      unit="unitPx"
      onChange={(widthPx) => set({ widthPx })}
    />
  );
}

export function TintSettings({
  value,
  target,
  set,
}: {
  readonly value: NonNullable<Effects['tint']>;
  readonly target: TargetKind;
  readonly set: SetEffect<typeof value>;
}): ReactNode {
  return (
    <Range
      label="optionsTintOpacity"
      range={RANGES.tint[target]}
      value={value.opacityPct}
      unit="unitPct"
      onChange={(opacityPct) => set({ opacityPct })}
    />
  );
}

export function StripesSettings({
  value,
  target,
  set,
}: {
  readonly value: NonNullable<PageEffects['stripes']> | NonNullable<ElementEffects['stripes']>;
  readonly target: TargetKind;
  readonly set: SetEffect<typeof value>;
}) {
  return (
    <>
      <Range
        label="optionsStripesOpacity"
        range={RANGES.stripes}
        value={value.opacityPct}
        unit="unitPct"
        onChange={(opacityPct) => set({ ...value, opacityPct })}
      />
      {target === 'page' && 'area' in value && (
        <Choice
          label="optionsStripesArea"
          options={[
            ['edge', 'areaEdge'],
            ['full', 'areaFull'],
          ]}
          value={value.area}
          onChange={(area) => set({ ...value, area })}
        />
      )}
    </>
  );
}

export function OutlineSettings({
  value,
  set,
}: {
  readonly value: NonNullable<Effects['outline']>;
  readonly set: SetEffect<typeof value>;
}) {
  const t = useT();
  const lineStyles = [
    ['solid', 'styleSolid'],
    ['dashed', 'styleDashed'],
    ['dotted', 'styleDotted'],
  ] as const;
  return (
    <>
      <Range
        label="optionsOutlineWidth"
        range={RANGES.outline}
        value={value.widthPx}
        unit="unitPx"
        onChange={(widthPx) => set({ ...value, widthPx })}
      />
      <Choice
        label="optionsOutlineStyle"
        options={lineStyles}
        value={value.style}
        onChange={(style) => set({ ...value, style })}
      />
      <Switch
        className={styles.switch}
        label={t('optionsOutlinePulse')}
        onText={t('optionsGroupOn')}
        offText={t('optionsGroupOff')}
        checked={value.pulse}
        onChange={(pulse) => set({ ...value, pulse })}
      />
    </>
  );
}
