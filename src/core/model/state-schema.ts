import type { core, ZodType } from 'zod';
import { type RegexBudgetErrorCode, regexBudgetError } from '../url/regex-budget';
import { siteGroupSchema } from './group-schema';
import type { SiteMarkState } from './schema';
import { reportDuplicateIds } from './unique-ids';
import { z } from './zod';

const MAX_SITE_GROUPS = 200;

/** ≤ 200 site groups; shared with the export envelope (src/core/data/export-schema.ts). */
export const siteGroupsSchema = z
  .array(siteGroupSchema)
  .max(MAX_SITE_GROUPS, `Expected at most ${MAX_SITE_GROUPS} site groups`);

const BUDGET_MESSAGE: Readonly<Record<RegexBudgetErrorCode, string>> = {
  regexLimitReached: 'Expected at most 500 regex patterns and excludes in all site groups',
  regexBudgetExceeded: 'Expected regex patterns that together cost at most 10^7 steps per URL',
};

/** The regexes of all site groups share one worst-case budget (REQ-URL-004). */
function reportRegexBudget(state: SiteMarkState, ctx: core.$RefinementCtx<SiteMarkState>): void {
  const code = regexBudgetError(state.siteGroups);
  if (code) ctx.addIssue({ code: 'custom', path: ['siteGroups'], message: BUDGET_MESSAGE[code] });
}

export const settingsSchema = z.strictObject({
  theme: z.enum(['system', 'light', 'dark']),
  language: z.enum(['auto', 'en', 'nl']).optional(),
});

export const stateSchema: ZodType<SiteMarkState> = z
  .strictObject({
    schemaVersion: z.literal(1),
    revision: z.int().min(0),
    siteGroups: siteGroupsSchema,
    settings: settingsSchema,
  })
  .superRefine(reportDuplicateIds)
  .superRefine(reportRegexBudget);
