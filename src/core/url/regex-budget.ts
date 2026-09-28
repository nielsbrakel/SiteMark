import type { SiteGroup } from '../model/schema';
import { notImplemented } from '../not-implemented';

export type RegexBudgetErrorCode = 'regexLimitReached' | 'regexBudgetExceeded';

export function regexBudgetError(
  _siteGroups: readonly Pick<SiteGroup, 'patterns' | 'excludes'>[],
): RegexBudgetErrorCode | undefined {
  return notImplemented();
}
