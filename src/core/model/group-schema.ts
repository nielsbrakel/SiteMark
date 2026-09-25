import type { ZodType } from 'zod';
import type { SiteGroupId } from '../ids';
import { idSchema, userText } from './fields';
import { urlPatternSchema } from './pattern-schema';
import type { SiteGroup } from './schema';
import { z } from './zod';

// REQ-GRP-002: 0..50 patterns, excludes and marks; an enabled group needs a pattern.

const MAX_ITEMS = 50;

const patterns = z.array(urlPatternSchema).max(MAX_ITEMS, `Expected at most ${MAX_ITEMS}`);

export const siteGroupSchema: ZodType<SiteGroup> = z
  .strictObject({
    id: idSchema<SiteGroupId>(),
    name: userText(1, 40),
    enabled: z.boolean(),
    patterns,
    excludes: patterns,
    // Marks arrive with T-041/T-042.
    marks: z.array(z.never()).max(MAX_ITEMS, `Expected at most ${MAX_ITEMS}`),
  })
  .refine((group) => !group.enabled || group.patterns.length > 0, {
    path: ['enabled'],
    message: 'An enabled site group needs at least one URL pattern',
  });
