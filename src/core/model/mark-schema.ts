import type { ZodType } from 'zod';
import type { MarkId } from '../ids';
import { elementEffectsSchema } from './element-effects-schema';
import { hexSchema, idSchema, userText } from './fields';
import { pageEffectsSchema } from './page-effects-schema';
import type { ElementMark, Mark, PageMark } from './schema';
import { z } from './zod';

// REQ-MARK-001: a mark targets the page or an element and has a color, a text color and effects
// that fit its target (REQ-MARK-014, D-223).

const MAX_SELECTOR = 500;

const markBase = {
  id: idSchema<MarkId>(),
  label: userText(0, 40).exactOptional(),
  enabled: z.boolean(),
  color: hexSchema,
  textColor: z.union([z.literal('auto'), hexSchema]),
};

const pageMarkSchema: ZodType<PageMark> = z.strictObject({
  ...markBase,
  target: z.strictObject({ kind: z.literal('page', 'Expected "page" or "element"') }),
  effects: pageEffectsSchema,
});

const selectorMessage = `Expected a CSS selector of 1-${MAX_SELECTOR} characters`;

const elementMarkSchema: ZodType<ElementMark> = z.strictObject({
  ...markBase,
  target: z.strictObject({
    kind: z.literal('element'),
    selector: z.string(selectorMessage).min(1, selectorMessage).max(MAX_SELECTOR, selectorMessage),
  }),
  effects: elementEffectsSchema,
});

function hasElementTarget(input: unknown): boolean {
  if (typeof input !== 'object' || input === null || !('target' in input)) return false;
  const { target } = input;
  return (
    typeof target === 'object' && target !== null && 'kind' in target && target.kind === 'element'
  );
}

/**
 * The discriminator is nested (`target.kind`), which zod's discriminated unions can't express, so
 * this picks the schema itself. Issues keep their paths, so they read like any other field's.
 */
export const markSchema: ZodType<Mark> = z.unknown().transform((input, ctx): Mark => {
  const schema = hasElementTarget(input) ? elementMarkSchema : pageMarkSchema;
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  for (const { path, message } of result.error.issues) {
    ctx.addIssue({ code: 'custom', path, message });
  }
  return z.NEVER;
});
