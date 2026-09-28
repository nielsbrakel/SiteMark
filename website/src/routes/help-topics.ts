/** The help topics (REQ-PAGE-004): one page each, `help/<topic>/`, in both languages. */
export type HelpTopic =
  | 'getting-started'
  | 'url-patterns'
  | 'marks-and-effects'
  | 'picking-an-element'
  | 'hiding-marks-and-shortcuts'
  | 'permissions'
  | 'import-and-export'
  | 'troubleshooting';

const TOPICS: readonly HelpTopic[] = [
  'getting-started',
  'url-patterns',
  'marks-and-effects',
  'picking-an-element',
  'hiding-marks-and-shortcuts',
  'permissions',
  'import-and-export',
  'troubleshooting',
];

/** Every help topic, in the order the help index lists them (the files' `order` agrees). */
export function helpTopics(): readonly HelpTopic[] {
  return TOPICS;
}
