import type { SiteGroup, UrlPattern } from '../model/schema';
import { assertNever, err, ok, type Result } from '../result';
import { normalizeUrlPattern, type UrlPatternValue } from '../url/match';
import type { PatternIssue } from './import';

// The schemas only check the shape of a pattern. An import file is as untrusted as manual entry, so
// every pattern and exclude goes through the URL engine again (REQ-URL-009, REQ-SEC-004).

function withCanonical({ id }: UrlPattern, canonical: UrlPatternValue): UrlPattern {
  switch (canonical.kind) {
    case 'wildcard':
      return { id, kind: 'wildcard', value: canonical.value };
    case 'regex':
      return { id, kind: 'regex', value: canonical.value, origins: [...canonical.origins] };
    default:
      return assertNever(canonical);
  }
}

function normalizeList(
  list: readonly UrlPattern[],
  path: string,
  issues: PatternIssue[],
): UrlPattern[] {
  return list.map((pattern, index) => {
    const canonical = normalizeUrlPattern(pattern);
    if (canonical.ok) return withCanonical(pattern, canonical.value);
    issues.push({ path: `${path}[${index}]`, code: canonical.error });
    return pattern;
  });
}

/**
 * Validates every pattern and exclude with the URL engine and stores it in canonical form, or
 * reports each rejected one (broad, unsafe, invalid) with its path.
 */
export function normalizeImportedPatterns(
  siteGroups: readonly SiteGroup[],
): Result<SiteGroup[], PatternIssue[]> {
  const issues: PatternIssue[] = [];
  const normalized = siteGroups.map((group, index) => ({
    ...group,
    patterns: normalizeList(group.patterns, `siteGroups[${index}].patterns`, issues),
    excludes: normalizeList(group.excludes, `siteGroups[${index}].excludes`, issues),
  }));
  return issues.length === 0 ? ok(normalized) : err(issues);
}
