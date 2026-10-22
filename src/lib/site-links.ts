import { notImplemented } from '@/core/not-implemented';
import { browserSource } from './i18n/browser-source';

// Where the popup and options footer link (D-256). Links only: the extension never fetches them.
const WEBSITE = 'https://nielsbrakel.github.io/SiteMark/';

export const websiteUrl = () => WEBSITE;
export const repositoryUrl = () => 'https://github.com/nielsbrakel/SiteMark';

/** The privacy policy page in the UI language (the website has Dutch pages under `nl/`). */
export function privacyUrl(): string {
  return `${WEBSITE}${browserSource.locale.startsWith('nl') ? 'nl/' : ''}privacy/`;
}

/** The website's help topics that the popup and the options page link to (`help/<topic>/`). */
export type HelpTopic =
  | 'picking-an-element'
  | 'url-patterns'
  | 'marks-and-effects'
  | 'hiding-marks-and-shortcuts'
  | 'troubleshooting';

/** The help index, or one topic, in the UI language. */
export function helpUrl(_topic?: HelpTopic): string {
  return notImplemented();
}
