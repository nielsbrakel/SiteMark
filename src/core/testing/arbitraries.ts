import fc from 'fast-check';
import type { EntityId, PatternId, SiteGroupId } from '../ids';
import type { SiteGroup, SiteMarkState, UrlPattern } from '../model/schema';
import { anId, userText } from './field-arbitraries';
import { elementMark, pageMark } from './mark-arbitraries';
import { canonicalWildcard, originPattern, regexSource } from './url-arbitraries';

// fast-check generators for schema-valid data (T-058). Values are already in their stored form
// (clean text, lowercase hex, canonical patterns), so parsing them changes nothing.

const urlPattern: fc.Arbitrary<UrlPattern> = fc.oneof(
  fc.record({
    id: anId<PatternId>(),
    kind: fc.constant('wildcard' as const),
    value: canonicalWildcard,
  }),
  fc.record({
    id: anId<PatternId>(),
    kind: fc.constant('regex' as const),
    value: regexSource,
    origins: fc.uniqueArray(originPattern, { minLength: 1, maxLength: 3 }),
  }),
);

/** A site group; only one with a pattern can be enabled. IDs may repeat until `uniqueIds`. */
const siteGroup: fc.Arbitrary<SiteGroup> = fc
  .record({
    id: anId<SiteGroupId>(),
    name: userText(1, 40),
    enabled: fc.boolean(),
    patterns: fc.array(urlPattern, { maxLength: 3 }),
    excludes: fc.array(urlPattern, { maxLength: 2 }),
    marks: fc.array(fc.oneof(pageMark, elementMark), { maxLength: 3 }),
  })
  .map((group) => ({ ...group, enabled: group.enabled && group.patterns.length > 0 }));

/**
 * Makes every ID in the groups unique (spec §7): the second and later uses of an ID are replaced by
 * `dup` + a counter that no generated ID uses.
 */
function uniqueIds(groups: readonly SiteGroup[]): SiteGroup[] {
  const seen = new Set<string>();
  let count = 0;
  const free = <I extends EntityId>(id: I): I => {
    let next = id;
    while (seen.has(next)) {
      count += 1;
      next = `dup${String(count).padStart(9, '0')}` as I;
    }
    seen.add(next);
    return next;
  };
  const freePattern = (pattern: UrlPattern): UrlPattern => ({ ...pattern, id: free(pattern.id) });
  return groups.map((group) => ({
    ...group,
    id: free(group.id),
    patterns: group.patterns.map(freePattern),
    excludes: group.excludes.map(freePattern),
    marks: group.marks.map((mark) => ({ ...mark, id: free(mark.id) })),
  }));
}

/** Site groups with unique IDs, as a valid state or import file holds them. */
export function siteGroups(maxLength = 5): fc.Arbitrary<SiteGroup[]> {
  return fc.array(siteGroup, { maxLength }).map(uniqueIds);
}

export const settings: fc.Arbitrary<SiteMarkState['settings']> = fc.record({
  theme: fc.constantFrom('system', 'light', 'dark'),
});

/** Any state that `parseState` accepts unchanged. */
export const siteMarkState: fc.Arbitrary<SiteMarkState> = fc.record({
  schemaVersion: fc.constant(1 as const),
  revision: fc.nat(),
  siteGroups: siteGroups(),
  settings,
});
