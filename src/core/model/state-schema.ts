import type { ZodType } from 'zod';
import { siteGroupSchema } from './group-schema';
import type { SiteMarkState } from './schema';
import { reportDuplicateIds } from './unique-ids';
import { z } from './zod';

const MAX_SITE_GROUPS = 200;

export const stateSchema: ZodType<SiteMarkState> = z
  .strictObject({
    schemaVersion: z.literal(1),
    revision: z.int().min(0),
    siteGroups: z
      .array(siteGroupSchema)
      .max(MAX_SITE_GROUPS, `Expected at most ${MAX_SITE_GROUPS} site groups`),
    settings: z.strictObject({ theme: z.enum(['system', 'light', 'dark']) }),
  })
  .superRefine(reportDuplicateIds);
