import type { ReactNode } from 'react';
import { assertNever } from '@/core/result';
import type { EffectName, TargetKind } from './effect-catalog';
import {
  FrameSettings,
  OutlineSettings,
  StripesSettings,
  TintSettings,
} from './range-effect-settings';
import type { Effects } from './setting-controls';
import {
  BannerSettings,
  RibbonSettings,
  TitlePrefixSettings,
  WatermarkSettings,
} from './text-effect-settings';
import { useT } from './translate';

export type EffectSettingsProps = {
  readonly name: EffectName;
  readonly effects: Effects;
  readonly target: TargetKind;
  readonly set: (value: unknown) => void;
};

/** The settings of one turned-on effect (REQ-OPT-003), with the ranges of spec §7. */
export function EffectSettings({ name, effects, target, set }: EffectSettingsProps): ReactNode {
  const t = useT();
  const e = effects;
  switch (name) {
    case 'ribbon':
      return e.ribbon && <RibbonSettings value={e.ribbon} set={set} />;
    case 'banner':
      return e.banner && <BannerSettings value={e.banner} set={set} />;
    case 'frame':
      return e.frame && <FrameSettings value={e.frame} set={set} />;
    case 'tint':
      return e.tint && <TintSettings value={e.tint} target={target} set={set} />;
    case 'stripes':
      return e.stripes && <StripesSettings value={e.stripes} target={target} set={set} />;
    case 'watermark':
      return e.watermark && <WatermarkSettings value={e.watermark} set={set} />;
    case 'titlePrefix':
      return e.titlePrefix && <TitlePrefixSettings value={e.titlePrefix} set={set} />;
    case 'favicon':
      return <p>{t('optionsFaviconHelp')}</p>;
    case 'outline':
      return e.outline && <OutlineSettings value={e.outline} set={set} />;
    default:
      return assertNever(name);
  }
}
