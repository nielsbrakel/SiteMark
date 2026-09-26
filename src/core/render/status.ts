import type { MarkId } from '../ids';
import { idSchema } from '../model/fields';
import { parseWith } from '../model/issues';
import type { SchemaResult } from '../model/schema';
import { z } from '../model/zod';

// What the marker in a tab reports back to the background (REQ-POP-002, REQ-POP-007, REQ-MARK-010).
// Used by the popup, the badge and the content script. Content scripts only `import type` from
// here (the schema below is for the background, which validates every report, REQ-SEC-003).

/** Whether an element mark's selector found its target in the tab (REQ-POP-002). */
export type MarkStatus = { readonly markId: MarkId; readonly found: boolean };

/**
 * The favicon tint (REQ-MARK-010): `off` when the tab's plan has none, `unavailable` when the
 * original favicon can't be read (CORS, tainted canvas, no favicon) and was left unchanged.
 */
export type FaviconStatus = 'available' | 'unavailable' | 'off';

/** The rendering status of one tab. */
export type TabStatus = {
  /** One entry per element mark in the tab's render plan. */
  readonly marks: readonly MarkStatus[];
  readonly favicon: FaviconStatus;
  /** "Hide on this tab" is on (REQ-RND-008). */
  readonly hidden: boolean;
};

/** 200 site groups × 50 marks: the most element marks a plan can hold. */
const MAX_MARKS = 10_000;

const tabStatusSchema = z.strictObject({
  marks: z
    .array(z.strictObject({ markId: idSchema<MarkId>(), found: z.boolean() }))
    .max(MAX_MARKS, `Expected at most ${MAX_MARKS} marks`),
  favicon: z.enum(['available', 'unavailable', 'off']),
  hidden: z.boolean(),
});

/** Validates a status from a content script (a report or an answer); never throws (D-225). */
export function parseTabStatus(input: unknown): SchemaResult<TabStatus> {
  return parseWith(tabStatusSchema, input);
}
