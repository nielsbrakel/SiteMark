import type extensionEn from '../../../public/_locales/en/messages.json';
// biome-ignore lint/style/noRestrictedImports: vite.config loads this file under Node, which has no `@/` alias.
import { MARK_FORM_KEYS } from '../../../src/ui/components/mark-form/mark-form-keys.ts';

/**
 * The extension's messages (public/_locales) that the website shows, through the reused marker
 * views, the mark preview and the playground. Only these ship in the website's language chunks
 * (website/scripts/slim-catalogs.ts, REQ-WEB-007); a key missing here is a type error at its use.
 */
export const SHARED_MESSAGE_KEYS = [
  ...MARK_FORM_KEYS,
  'markerCollapseBanner',
  'markerExpandBanner',
  'themeSystem',
  'themeLight',
  'themeDark',
] as const satisfies readonly (keyof typeof extensionEn)[];

export type SharedMessageKey = (typeof SHARED_MESSAGE_KEYS)[number];
