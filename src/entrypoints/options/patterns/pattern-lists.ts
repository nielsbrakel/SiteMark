import type { MessageKey } from '@/lib/i18n/browser-source';

/** The two pattern lists of a site group: URL patterns and excludes (REQ-URL-008). */
export type PatternListKind = 'patterns' | 'excludes';

type ListText = {
  readonly heading: MessageKey;
  readonly type: MessageKey;
  readonly input: MessageKey;
  readonly origins: MessageKey;
  readonly add: MessageKey;
};

/** The labels of each list's section and Add form; distinct, so every control has its own name. */
export const LIST_TEXT: Readonly<Record<PatternListKind, ListText>> = {
  patterns: {
    heading: 'optionsPatterns',
    type: 'optionsPatternType',
    input: 'optionsPatternInput',
    origins: 'optionsOrigins',
    add: 'optionsAddPattern',
  },
  excludes: {
    heading: 'optionsExcludes',
    type: 'optionsExcludeType',
    input: 'optionsExcludeInput',
    origins: 'optionsExcludeOrigins',
    add: 'optionsAddExclude',
  },
};
