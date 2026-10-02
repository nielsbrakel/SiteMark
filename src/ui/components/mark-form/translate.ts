import { createContext, use } from 'react';
import type { MessageKey } from '@/lib/i18n/message-key';

/**
 * The messages the mark form reads. The website ships exactly these (SHARED_MESSAGE_KEYS), so a key
 * the form uses must be listed here: using any other is a type error.
 */
export const MARK_FORM_KEYS = [
  'effectRibbon',
  'effectBanner',
  'effectFrame',
  'effectOutline',
  'effectTint',
  'effectStripes',
  'effectWatermark',
  'effectTitlePrefix',
  'effectFavicon',
  'colorRed',
  'colorAmber',
  'colorBlue',
  'colorSlate',
  'optionsColor',
  'optionsCustomColor',
  'optionsCustomTextColor',
  'optionsPickColor',
  'optionsHexInvalid',
  'optionsTextColor',
  'optionsTextAuto',
  'optionsTextCustom',
  'optionsTextAutoBlack',
  'optionsTextAutoWhite',
  'optionsTextRequired',
  'optionsEffects',
  'optionsLastEffectHint',
  'optionsFaviconHelp',
  'optionsRibbonText',
  'optionsRibbonCorner',
  'cornerTopLeft',
  'cornerTopRight',
  'cornerBottomLeft',
  'cornerBottomRight',
  'optionsBannerText',
  'optionsBannerEdge',
  'edgeTop',
  'edgeBottom',
  'optionsBannerSize',
  'sizeCompact',
  'sizeRegular',
  'optionsFrameWidth',
  'optionsTintOpacity',
  'optionsStripesOpacity',
  'optionsStripesArea',
  'areaEdge',
  'areaFull',
  'optionsOutlineWidth',
  'optionsOutlineStyle',
  'styleSolid',
  'styleDashed',
  'styleDotted',
  'optionsOutlinePulse',
  'optionsWatermarkText',
  'optionsWatermarkOpacity',
  'optionsTitlePrefixText',
  'optionsTitlePrefixHelp',
  'unitPx',
  'unitPct',
] as const satisfies readonly MessageKey[];

export type MarkFormKey = (typeof MARK_FORM_KEYS)[number];

/** The translator of the page that shows the form: the extension's or the website's. */
export type Translate = (key: MarkFormKey, substitutions?: string) => string;

export const TranslateContext = createContext<Translate | undefined>(undefined);

export function useT(): Translate {
  const t = use(TranslateContext);
  if (!t) throw new Error('[SiteMark] the mark form needs a TranslateContext');
  return t;
}
