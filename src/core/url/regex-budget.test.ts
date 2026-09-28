import { describe, expect, it } from 'vitest';
import type { SiteGroup } from '../model/schema';
import { aRegexPattern, aSiteGroup, aWildcardPattern } from '../testing/builders';
import { times } from '../testing/schema-results';
import { regexBudgetError } from './regex-budget';

// A crafted import could hold 200 × 100 regexes that each pass the per-regex limit (10⁷ steps) and
// share one origin: matching one URL then took over a minute. The whole state gets one budget.

/** Unanchored `a{1,2000}b`: ~8.2 × 10⁶ worst-case steps, so one fits the budget and two don't. */
const heavy = () => aRegexPattern({ value: 'a{1,2000}b' });
/** Unanchored `example\.com/app`: ~33,000 steps. */
const light = () => aRegexPattern({ value: String.raw`example\.com/app` });

const groupsOf = (count: number, make: () => Partial<SiteGroup>) =>
  times(count, () => aSiteGroup(make()));

describe('REQ-URL-004 the regex patterns of all site groups share one budget', () => {
  it('accepts 500 regex patterns and excludes across all site groups', () => {
    const groups = groupsOf(10, () => ({
      patterns: times(25, () => aRegexPattern()),
      excludes: times(25, () => aRegexPattern()),
    }));
    expect(regexBudgetError(groups)).toBeUndefined();
  });

  it('refuses a 501st regex, wherever it is', () => {
    const full = groupsOf(10, () => ({ patterns: times(50, () => aRegexPattern()) }));
    expect(regexBudgetError([...full, aSiteGroup({ patterns: [aRegexPattern()] })])).toBe(
      'regexLimitReached',
    );
    expect(regexBudgetError([...full, aSiteGroup({ excludes: [aRegexPattern()] })])).toBe(
      'regexLimitReached',
    );
  });

  it('does not count wildcard patterns', () => {
    const wildcards = groupsOf(20, () => ({
      patterns: times(50, () => aWildcardPattern()),
      excludes: times(50, () => aWildcardPattern()),
    }));
    expect(regexBudgetError([...wildcards, aSiteGroup({ patterns: [heavy()] })])).toBeUndefined();
  });

  it('refuses regexes whose worst cases add up to more than 10⁷ steps', () => {
    expect(regexBudgetError([aSiteGroup({ patterns: [heavy()] })])).toBeUndefined();
    expect(
      regexBudgetError([aSiteGroup({ patterns: [heavy()] }), aSiteGroup({ patterns: [heavy()] })]),
    ).toBe('regexBudgetExceeded');
    expect(regexBudgetError([aSiteGroup({ patterns: [heavy()], excludes: [heavy()] })])).toBe(
      'regexBudgetExceeded',
    );
  });

  it('adds up many cheap regexes too', () => {
    const cheap = (count: number) => groupsOf(1, () => ({ patterns: times(count, light) }));
    expect(regexBudgetError([aSiteGroup({ patterns: [heavy()] }), ...cheap(50)])).toBeUndefined();
    expect(
      regexBudgetError([aSiteGroup({ patterns: [heavy()] }), ...cheap(50), ...cheap(10)]),
    ).toBe('regexBudgetExceeded');
  });
});
