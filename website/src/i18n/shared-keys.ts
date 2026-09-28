import type extensionEn from '../../../public/_locales/en/messages.json';

/**
 * The extension's messages (public/_locales) that the website shows, through the reused marker
 * views, the mark preview and the playground. Only these ship in the website's language chunks
 * (website/scripts/slim-catalogs.ts, REQ-WEB-007); a key missing here is a type error at its use.
 */
export const SHARED_MESSAGE_KEYS = [
  'markerCollapseBanner',
  'markerExpandBanner',
  'effectRibbon',
  'effectBanner',
  'effectFrame',
  'effectTint',
  'effectStripes',
  'effectWatermark',
  'effectTitlePrefix',
  'effectOutline',
  'optionsColor',
  'colorRed',
  'colorAmber',
  'colorBlue',
  'colorSlate',
  'optionsCustomColor',
  'optionsHexInvalid',
  'optionsRibbonCorner',
  'cornerTopLeft',
  'cornerTopRight',
  'cornerBottomLeft',
  'cornerBottomRight',
  'optionsBannerEdge',
  'edgeTop',
  'edgeBottom',
  'optionsTextRequired',
] as const satisfies readonly (keyof typeof extensionEn)[];

export type SharedMessageKey = (typeof SHARED_MESSAGE_KEYS)[number];
