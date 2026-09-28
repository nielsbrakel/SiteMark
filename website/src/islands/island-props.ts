import type { WebsiteTranslator } from '../i18n/website-t';

/** What an island gets, on the server and in the browser alike (so hydration matches). */
export type IslandProps = { t: WebsiteTranslator['t'] };
