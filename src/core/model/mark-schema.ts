import type { ZodType } from 'zod';
import type { MarkId } from '../ids';
import { hexSchema, idSchema, userText } from './fields';
import { pageEffectsSchema } from './page-effects-schema';
import type { Mark, PageMark } from './schema';
import { z } from './zod';

// REQ-MARK-001: a mark targets the page or an element and has a color, a text color and effects.

const markBase = {
  id: idSchema<MarkId>(),
  label: userText(0, 40).exactOptional(),
  enabled: z.boolean(),
  color: hexSchema,
  textColor: z.union([z.literal('auto'), hexSchema]),
};

const pageMarkSchema: ZodType<PageMark> = z.strictObject({
  ...markBase,
  target: z.strictObject({ kind: z.literal('page') }),
  effects: pageEffectsSchema,
});

export const markSchema: ZodType<Mark> = pageMarkSchema;
