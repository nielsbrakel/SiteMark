// biome-ignore-all lint/security/noSecrets: i18n message keys, not secrets
import type { WebsiteMessageKey } from '../i18n/website-t';
import type { HelpTopic } from '../routes/help-topics';

/** The help index groups its topics by what the reader is doing; every topic is in one group. */
export const HELP_GROUPS: readonly { heading: WebsiteMessageKey; topics: readonly HelpTopic[] }[] =
  [
    { heading: 'websiteHelpGroupStart', topics: ['getting-started', 'site-groups'] },
    {
      heading: 'websiteHelpGroupMark',
      topics: ['url-patterns', 'marks-and-effects', 'picking-an-element'],
    },
    {
      heading: 'websiteHelpGroupUse',
      topics: ['hiding-marks-and-shortcuts', 'settings-and-appearance', 'import-and-export'],
    },
    { heading: 'websiteHelpGroupFix', topics: ['permissions', 'troubleshooting'] },
  ];

/** Quick links to the topic that answers a common problem. */
export const HELP_PROBLEMS: readonly { text: WebsiteMessageKey; topic: HelpTopic }[] = [
  { text: 'websiteHelpProblemMarks', topic: 'troubleshooting' },
  { text: 'websiteHelpProblemAccess', topic: 'permissions' },
  { text: 'websiteHelpProblemDemo', topic: 'hiding-marks-and-shortcuts' },
  { text: 'websiteHelpProblemData', topic: 'import-and-export' },
];
