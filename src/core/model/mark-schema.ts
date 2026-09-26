import type { ZodType } from 'zod';
import type { MarkId } from '../ids';
import { elementEffectsSchema } from './element-effects-schema';
import { hexSchema, idSchema, userText } from './fields';
import { pageEffectsSchema } from './page-effects-schema';
import type { ElementMark, Mark, MarkDraft, PageMark } from './schema';
import { z } from './zod';

// REQ-MARK-001: a mark targets the page or an element and has a color, a text color and effects
// that fit its target (REQ-MARK-014, D-223). A draft is a mark before the background gives it an ID.

const MAX_SELECTOR = 500;

const idField = { id: idSchema<MarkId>() };

const markBase = {
  label: userText(0, 40).exactOptional(),
  enabled: z.boolean(),
  color: hexSchema,
  textColor: z.union([z.literal('auto'), hexSchema]),
};

const pageFields = {
  target: z.strictObject({ kind: z.literal('page', 'Expected "page" or "element"') }),
  effects: pageEffectsSchema,
};

const selectorMessage = `Expected a CSS selector of 1-${MAX_SELECTOR} characters`;

const elementFields = {
  target: z.strictObject({
    kind: z.literal('element'),
    selector: z.string(selectorMessage).min(1, selectorMessage).max(MAX_SELECTOR, selectorMessage),
  }),
  effects: elementEffectsSchema,
};

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
function byTarget<P, E>(page: ZodType<P>, element: ZodType<E>): ZodType<P | E> {
  return z.unknown().transform((input, ctx): P | E => {
    const schema: ZodType<P | E> = hasElementTarget(input) ? element : page;
    const result = schema.safeParse(input);
    if (result.success) return result.data;
    for (const { path, message } of result.error.issues) {
      ctx.addIssue({ code: 'custom', path, message });
    }
    return z.NEVER;
  });
}

const pageMarkSchema: ZodType<PageMark> = z.strictObject({
  ...idField,
  ...markBase,
  ...pageFields,
});
const elementMarkSchema: ZodType<ElementMark> = z.strictObject({
  ...idField,
  ...markBase,
  ...elementFields,
});

export const markSchema: ZodType<Mark> = byTarget(pageMarkSchema, elementMarkSchema);

/** A mark without its ID, as the addMark and updateMark commands carry it. */
export const markDraftSchema: ZodType<MarkDraft> = byTarget(
  z.strictObject({ ...markBase, ...pageFields }),
  z.strictObject({ ...markBase, ...elementFields }),
);
