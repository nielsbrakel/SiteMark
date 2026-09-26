import { atLeastOneEffect, intRange, userText } from './fields';
import { z } from './zod';

// Page effects (REQ-MARK-002…010, REQ-MARK-015). An absent key means the effect is off (D-223).

/** Shared by page and element marks (REQ-MARK-002). Its text is the non-color cue (REQ-MARK-015). */
export const ribbonSchema = z.strictObject({
  text: userText(1, 16),
  corner: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right']),
});

export const pageEffectsSchema = z
  .strictObject({
    ribbon: ribbonSchema.exactOptional(),
    banner: z
      .strictObject({
        text: userText(1, 60),
        edge: z.enum(['top', 'bottom']),
        size: z.enum(['compact', 'regular']),
      })
      .exactOptional(),
    frame: z.strictObject({ widthPx: intRange(2, 16) }).exactOptional(),
    tint: z.strictObject({ opacityPct: intRange(3, 15) }).exactOptional(),
    stripes: z
      .strictObject({ opacityPct: intRange(5, 40), area: z.enum(['edge', 'full']) })
      .exactOptional(),
    watermark: z
      .strictObject({ text: userText(1, 24), opacityPct: intRange(4, 12) })
      .exactOptional(),
    titlePrefix: z.strictObject({ text: userText(1, 16) }).exactOptional(),
    favicon: z.strictObject({}).exactOptional(),
  })
  .refine(...atLeastOneEffect);
