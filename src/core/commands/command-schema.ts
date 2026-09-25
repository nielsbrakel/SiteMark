import type { ZodType } from 'zod';
import type { MarkId, PatternId, SiteGroupId } from '../ids';
import { idSchema } from '../model/fields';
import { parseWith } from '../model/issues';
import { markDraftSchema } from '../model/mark-schema';
import type { SchemaResult } from '../model/schema';
import { settingsSchema } from '../model/state-schema';
import { z } from '../model/zod';
import type { Command } from './command';

// The shape of every command (REQ-SEC-001, REQ-SEC-004). The message layer validates incoming
// commands with it before they reach applyCommand. It checks structure only: strict objects, IDs,
// types and generous size caps. Names, pattern syntax and limits are the reducers' job, so the user
// gets a typed error code (e.g. patternTooLong) instead of a schema issue. Mark drafts are read by
// the model's mark schema, like stored marks.

const MAX_TEXT = 8192;
const MAX_ORIGINS = 100;

const text = z.string().max(MAX_TEXT, `Expected at most ${MAX_TEXT} characters`);
const id = idSchema<SiteGroupId>();
const groupId = id;
const patternId = idSchema<PatternId>();
const markId = idSchema<MarkId>();
const toIndex = z.int();

const draft = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('wildcard'), value: text }),
  z.strictObject({
    kind: z.literal('regex'),
    value: text,
    origins: z.array(text).max(MAX_ORIGINS, `Expected at most ${MAX_ORIGINS} origins`),
  }),
]);

const siteGroupCommands = [
  z.strictObject({ type: z.literal('createSiteGroup'), name: text }),
  z.strictObject({ type: z.literal('renameSiteGroup'), id, name: text }),
  z.strictObject({ type: z.literal('deleteSiteGroup'), id }),
  // biome-ignore lint/security/noSecrets: a command type, not a secret.
  z.strictObject({ type: z.literal('setSiteGroupEnabled'), id, enabled: z.boolean() }),
  z.strictObject({ type: z.literal('moveSiteGroup'), id, toIndex }),
  z.strictObject({ type: z.literal('duplicateSiteGroup'), id }),
] as const;

const patternCommands = [
  z.strictObject({ type: z.literal('addPattern'), groupId, draft }),
  z.strictObject({ type: z.literal('updatePattern'), groupId, patternId, draft }),
  z.strictObject({ type: z.literal('removePattern'), groupId, patternId }),
  z.strictObject({ type: z.literal('addExclude'), groupId, draft }),
  z.strictObject({ type: z.literal('updateExclude'), groupId, patternId, draft }),
  z.strictObject({ type: z.literal('removeExclude'), groupId, patternId }),
] as const;

const markCommands = [
  z.strictObject({ type: z.literal('addMark'), groupId, mark: markDraftSchema }),
  z.strictObject({ type: z.literal('updateMark'), groupId, markId, mark: markDraftSchema }),
  z.strictObject({ type: z.literal('removeMark'), groupId, markId }),
  z.strictObject({ type: z.literal('moveMark'), groupId, markId, toIndex }),
] as const;

const otherCommands = [
  z.strictObject({
    type: z.literal('markThisSite'),
    origin: z.strictObject({ hostname: text, port: text }),
  }),
  z.strictObject({ type: z.literal('setTheme'), theme: settingsSchema.shape.theme }),
] as const;

/** Every command, discriminated by `type` (the message protocol's `command` payload). */
export const commandSchema: ZodType<Command> = z.discriminatedUnion('type', [
  ...siteGroupCommands,
  ...patternCommands,
  ...markCommands,
  ...otherCommands,
]);

/** Validates an untrusted command; never throws (D-225). */
export function parseCommand(input: unknown): SchemaResult<Command> {
  return parseWith(commandSchema, input);
}
