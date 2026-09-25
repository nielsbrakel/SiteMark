import type { ZodType } from 'zod';
import type { SiteGroupId } from '../ids';
import { idSchema, userText } from './fields';
import { markSchema } from './mark-schema';
import { urlPatternSchema } from './pattern-schema';
import type { SiteGroup } from './schema';
import { z } from './zod';

// REQ-GRP-002: 0..50 patterns, excludes and marks; an enabled group needs a pattern.

const MAX_ITEMS = 50;

const limitMessage = `Expected at most ${MAX_ITEMS}`;
const patterns = z.array(urlPatternSchema).max(MAX_ITEMS, limitMessage);

export const siteGroupSchema: ZodType<SiteGroup> = z
  .strictObject({
    id: idSchema<SiteGroupId>(),
    name: userText(1, 40),
    enabled: z.boolean(),
    patterns,
    excludes: patterns,
    marks: z.array(markSchema).max(MAX_ITEMS, limitMessage),
  })
  .refine((group) => !group.enabled || group.patterns.length > 0, {
    path: ['enabled'],
    message: 'An enabled site group needs at least one URL pattern',
  });
