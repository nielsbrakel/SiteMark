import { EffectTextField } from './EffectTextField';
import { RANGES } from './effect-catalog';
import { Choice, type Effects, Range, type SetEffect } from './setting-controls';
import { useT } from './translate';

// Settings of the effects with a required text (REQ-MARK-015): ribbon, banner, watermark and title
// prefix.

const CORNERS = [
  ['top-left', 'cornerTopLeft'],
  ['top-right', 'cornerTopRight'],
  ['bottom-left', 'cornerBottomLeft'],
  ['bottom-right', 'cornerBottomRight'],
] as const;

export function RibbonSettings({
  value,
  set,
}: {
  readonly value: NonNullable<Effects['ribbon']>;
  readonly set: SetEffect<typeof value>;
}) {
  const t = useT();
  return (
    <>
      <EffectTextField
        label={t('optionsRibbonText')}
        value={value.text}
        maxLength={16}
        onSave={(text) => set({ ...value, text })}
      />
      <Choice
        label="optionsRibbonCorner"
        options={CORNERS}
        value={value.corner}
        onChange={(corner) => set({ ...value, corner })}
      />
    </>
  );
}

export function BannerSettings({
  value,
  set,
}: {
  readonly value: NonNullable<Effects['banner']>;
  readonly set: SetEffect<typeof value>;
}) {
  const t = useT();
  return (
    <>
      <EffectTextField
        label={t('optionsBannerText')}
        value={value.text}
        maxLength={60}
        onSave={(text) => set({ ...value, text })}
      />
      <Choice
        label="optionsBannerEdge"
        options={[
          ['top', 'edgeTop'],
          ['bottom', 'edgeBottom'],
        ]}
        value={value.edge}
        onChange={(edge) => set({ ...value, edge })}
      />
      <Choice
        label="optionsBannerSize"
        options={[
          ['compact', 'sizeCompact'],
          ['regular', 'sizeRegular'],
        ]}
        value={value.size}
        onChange={(size) => set({ ...value, size })}
      />
    </>
  );
}

export function WatermarkSettings({
  value,
  set,
}: {
  readonly value: NonNullable<Effects['watermark']>;
  readonly set: SetEffect<typeof value>;
}) {
  const t = useT();
  return (
    <>
      <EffectTextField
        label={t('optionsWatermarkText')}
        value={value.text}
        maxLength={24}
        onSave={(text) => set({ ...value, text })}
      />
      <Range
        label="optionsWatermarkOpacity"
        range={RANGES.watermark}
        value={value.opacityPct}
        unit="unitPct"
        onChange={(opacityPct) => set({ ...value, opacityPct })}
      />
    </>
  );
}

export function TitlePrefixSettings({
  value,
  set,
}: {
  readonly value: NonNullable<Effects['titlePrefix']>;
  readonly set: SetEffect<typeof value>;
}) {
  const t = useT();
  return (
    <>
      <EffectTextField
        label={t('optionsTitlePrefixText')}
        value={value.text}
        maxLength={16}
        onSave={(text) => set({ text })}
      />
      <p>{t('optionsTitlePrefixHelp')}</p>
    </>
  );
}
