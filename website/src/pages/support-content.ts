// biome-ignore-all lint/security/noSecrets: i18n message keys, not secrets
import type { ContactUrls } from '../config/contact';
import type { WebsiteMessageKey } from '../i18n/website-t';

/** A contact route: the link and one sentence about when to use it. */
type ContactRoute = {
  url: keyof ContactUrls;
  link: WebsiteMessageKey;
  text: WebsiteMessageKey;
};

/** The GitHub routes of REQ-PAGE-003, in the order people need them. */
export const CONTACT_ROUTES: readonly ContactRoute[] = [
  { url: 'bugReport', link: 'websiteSupportBugLink', text: 'websiteSupportBugText' },
  { url: 'featureRequest', link: 'websiteSupportFeatureLink', text: 'websiteSupportFeatureText' },
  { url: 'securityReport', link: 'websiteSupportSecurityLink', text: 'websiteSupportSecurityText' },
];

/** The FAQ of REQ-PAGE-003: question and answer keys. */
export const FAQ: readonly { question: WebsiteMessageKey; answer: WebsiteMessageKey }[] = [
  { question: 'websiteFaqRestrictedQuestion', answer: 'websiteFaqRestrictedAnswer' },
  { question: 'websiteFaqPermissionQuestion', answer: 'websiteFaqPermissionAnswer' },
  { question: 'websiteFaqMarksQuestion', answer: 'websiteFaqMarksAnswer' },
  { question: 'websiteFaqHideQuestion', answer: 'websiteFaqHideAnswer' },
  { question: 'websiteFaqDataQuestion', answer: 'websiteFaqDataAnswer' },
  { question: 'websiteFaqRemoveQuestion', answer: 'websiteFaqRemoveAnswer' },
];

/** What a useful bug report contains (REQ-PAGE-003, REQ-OPT-007). */
export const BUG_REPORT_ITEMS: readonly WebsiteMessageKey[] = [
  'websiteBugReportBrowser',
  'websiteBugReportVersion',
  'websiteBugReportDiagnostics',
  'websiteBugReportSteps',
  'websiteBugReportPrivate',
];
