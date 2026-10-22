import { browserSource } from './i18n/browser-source';

// Where the popup and options footer link (D-256). Links only: the extension never fetches them.
const WEBSITE = 'https://nielsbrakel.github.io/SiteMark/';

export const websiteUrl = () => WEBSITE;
export const repositoryUrl = () => 'https://github.com/nielsbrakel/SiteMark';

/** A website page in the UI language (the website has Dutch pages under `nl/`). */
const pageUrl = (path: string) =>
  `${WEBSITE}${browserSource.locale.startsWith('nl') ? 'nl/' : ''}${path}`;

export const privacyUrl = () => pageUrl('privacy/');

/** The website's help topics that the popup and the options page link to (`help/<topic>/`). */
export type HelpTopic =
  | 'picking-an-element'
  | 'url-patterns'
  | 'marks-and-effects'
  | 'hiding-marks-and-shortcuts'
  | 'troubleshooting';

/** The help index, or one topic, in the UI language. */
export const helpUrl = (topic?: HelpTopic) => pageUrl(topic ? `help/${topic}/` : 'help/');
