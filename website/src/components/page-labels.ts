import type { WebsiteMessageKey } from '../i18n/website-t';
import type { PageId } from '../routes/routes';

// A Record, so a new page ID without a label is a type error.
const LABELS: Record<PageId, WebsiteMessageKey> = {
  home: 'websiteNavHome',
  help: 'websiteNavHelp',
  // biome-ignore lint/security/noSecrets: an i18n key, not a secret
  playground: 'websiteNavPlayground',
  support: 'websiteNavSupport',
  privacy: 'websiteNavPrivacy',
  changelog: 'websiteNavChangelog',
};

/** The link text of a page in the header and the footer. */
export function pageLabel(page: PageId): WebsiteMessageKey {
  return LABELS[page];
}
