import type { WebsiteTranslator } from '../i18n/website-t';

/** What every page component gets, on the server and in the browser alike (so hydration matches). */
export type PageProps = { t: WebsiteTranslator['t']; tp: WebsiteTranslator['tp'] };
