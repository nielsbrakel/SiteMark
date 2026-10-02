import { browserSource } from './i18n/browser-source';

// Where the popup and options footer link (D-256). Links only: the extension never fetches them.
const WEBSITE = 'https://nielsbrakel.github.io/SiteMark/';

export const websiteUrl = () => WEBSITE;
export const repositoryUrl = () => 'https://github.com/nielsbrakel/SiteMark';

/** The privacy policy page in the UI language (the website has Dutch pages under `nl/`). */
export function privacyUrl(): string {
  return `${WEBSITE}${browserSource.locale.startsWith('nl') ? 'nl/' : ''}privacy/`;
}
