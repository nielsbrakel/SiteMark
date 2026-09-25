import type { EntityId, PatternId, SiteGroupId } from '../ids';
import type {
  Mark,
  OriginPattern,
  PageMark,
  RegexPattern,
  SiteGroup,
  SiteMarkState,
  WildcardPattern,
} from '../model/schema';
import { notImplemented } from '../not-implemented';

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
export function aPageMark(_overrides: Partial<PageMark> = {}): PageMark {
  return notImplemented();
}

/** Any valid mark: a page ribbon, like `aPageMark()`. */
export function aMark(_overrides: Partial<PageMark> = {}): Mark {
  return notImplemented();
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
