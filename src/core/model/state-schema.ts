import type { ZodType } from 'zod';
import { siteGroupSchema } from './group-schema';
import type { SiteMarkState } from './schema';
import { reportDuplicateIds } from './unique-ids';
import { z } from './zod';

const MAX_SITE_GROUPS = 200;

/** ≤ 200 site groups; shared with the export envelope (src/core/data/export-schema.ts). */
export const siteGroupsSchema = z
  .array(siteGroupSchema)
  .max(MAX_SITE_GROUPS, `Expected at most ${MAX_SITE_GROUPS} site groups`);

export const settingsSchema = z.strictObject({ theme: z.enum(['system', 'light', 'dark']) });

export const stateSchema: ZodType<SiteMarkState> = z
  .strictObject({
    schemaVersion: z.literal(1),
    revision: z.int().min(0),
    siteGroups: siteGroupsSchema,
    settings: settingsSchema,
  })
  .superRefine(reportDuplicateIds);
