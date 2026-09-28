import type { RegexErrorCode } from '../errors';
import type { SiteGroup } from '../model/schema';
import { regexSteps } from './regex-safety';

// One budget for the regexes of the whole state (REQ-URL-004, REQ-SEC-004). Each regex is capped at
// 10⁷ worst-case steps on its own (regex-safety.ts), but a URL is tested against every regex whose
// origin matches it: a crafted import with 10,000 such regexes and one origin took over a minute
// for one URL. Measured in V8, a worst-case step costs 0.4-2.7 ns, so the whole state is held to
// what one regex may cost: 27-40 ms per hostile URL, the ceiling one accepted regex already has.
// The count stays below the compiled-regex cache (1000 entries, memo.ts), so it never thrashes.

const MAX_REGEXES = 500;
const MAX_TOTAL_STEPS = 10_000_000;

export type RegexBudgetErrorCode = Extract<
  RegexErrorCode,
  'regexLimitReached' | 'regexBudgetExceeded'
>;

type WithPatterns = Pick<SiteGroup, 'patterns' | 'excludes'>;

function regexSourcesOf(siteGroups: readonly WithPatterns[]): string[] {
  return siteGroups.flatMap((group) =>
    [...group.patterns, ...group.excludes].flatMap((pattern) =>
      pattern.kind === 'regex' ? [pattern.value] : [],
    ),
  );
}

/**
 * Why the regex patterns and excludes of these site groups don't fit the shared budget, or
 * `undefined`: at most 500 regexes, whose worst cases add up to at most 10⁷ steps per URL.
 */
export function regexBudgetError(
  siteGroups: readonly WithPatterns[],
): RegexBudgetErrorCode | undefined {
  const sources = regexSourcesOf(siteGroups);
  if (sources.length > MAX_REGEXES) return 'regexLimitReached';
  const total = sources.reduce((sum, source) => sum + regexSteps(source), 0);
  return total > MAX_TOTAL_STEPS ? 'regexBudgetExceeded' : undefined;
}
