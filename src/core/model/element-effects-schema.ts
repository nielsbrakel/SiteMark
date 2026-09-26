import { atLeastOneEffect, intRange } from './fields';
import { ribbonSchema } from './page-effects-schema';
import { z } from './zod';

// Element effects (REQ-MARK-002, 003, 004, 007). Page-only effects are unknown keys here, so the
// strict object rejects them (REQ-MARK-014).

export const elementEffectsSchema = z
  .strictObject({
    ribbon: ribbonSchema.exactOptional(),
    outline: z
      .strictObject({
        widthPx: intRange(1, 8),
        style: z.enum(['solid', 'dashed', 'dotted']),
        pulse: z.boolean(),
      })
      .exactOptional(),
    tint: z.strictObject({ opacityPct: intRange(5, 40) }).exactOptional(),
    stripes: z.strictObject({ opacityPct: intRange(5, 40) }).exactOptional(),
  })
  .refine(...atLeastOneEffect);
