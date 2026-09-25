import type { EntityId, MarkId, PatternId, SiteGroupId } from '../ids';
import type {
  Hex,
  Mark,
  OriginPattern,
  PageMark,
  RegexPattern,
  SiteGroup,
  SiteMarkState,
  WildcardPattern,
} from '../model/schema';

// Test builders: each returns schema-valid data with deterministic IDs; overrides replace whole
// top-level fields. IDs come from one counter per test file (`grp-00000001`, `pat-00000002`, …),
// so they never repeat within a state and never clash with fixedIdGen().

let count = 0;

function nextId<I extends EntityId>(prefix: 'grp' | 'mrk' | 'pat'): I {
  count += 1;
  return `${prefix}-${String(count).padStart(8, '0')}` as I;
}

export function aWildcardPattern(overrides: Partial<WildcardPattern> = {}): WildcardPattern {
  return {
    id: nextId<PatternId>('pat'),
    kind: 'wildcard',
    value: 'https://prod.example.com/*',
    ...overrides,
  };
}

export function aRegexPattern(overrides: Partial<RegexPattern> = {}): RegexPattern {
  return {
    id: nextId<PatternId>('pat'),
    kind: 'regex',
    value: '^https://prod\\.example\\.com/(admin|settings)/',
    origins: ['https://prod.example.com/*' as OriginPattern],
    ...overrides,
  };
}

/** A red page ribbon. */
export function aPageMark(overrides: Partial<PageMark> = {}): PageMark {
  return {
    id: nextId<MarkId>('mrk'),
    enabled: true,
    color: '#c93a2e' as Hex,
    textColor: 'auto',
    target: { kind: 'page' },
    effects: { ribbon: { text: 'PROD', corner: 'top-right' } },
    ...overrides,
  };
}

/** Any valid mark: a page ribbon, like `aPageMark()`. */
export function aMark(overrides: Partial<PageMark> = {}): Mark {
  return aPageMark(overrides);
}

export function aSiteGroup(overrides: Partial<SiteGroup> = {}): SiteGroup {
  return {
    id: nextId<SiteGroupId>('grp'),
    name: 'Production',
    enabled: true,
    patterns: [aWildcardPattern()],
    excludes: [],
    marks: [],
    ...overrides,
  };
}

export function aState(overrides: Partial<SiteMarkState> = {}): SiteMarkState {
  return {
    schemaVersion: 1,
    revision: 0,
    siteGroups: [aSiteGroup()],
    settings: { theme: 'system' },
    ...overrides,
  };
}
