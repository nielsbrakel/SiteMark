import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

// Playwright axe (REQ-A11Y-004): the WCAG 2.2 AA rules, failing on serious or critical issues.

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/** `rule: selectors` for each serious or critical violation on the page. */
export async function seriousViolations(page: Page): Promise<string[]> {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  return violations
    .filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))
    .map(({ id, nodes }) => `${id}: ${nodes.map((node) => node.target.join(' ')).join(', ')}`);
}
