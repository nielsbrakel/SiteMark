import type { ZodType } from 'zod';
import type {
  BackgroundMessageType,
  BackgroundProtocol,
  ContentMessageType,
  DataOf,
  ElementEffectKind,
  PageMessageType,
} from '../app/protocol';
import { parseCommand } from '../core/commands/command-schema';
import type { MarkId, SiteGroupId } from '../core/ids';
import { hexSchema, idSchema } from '../core/model/fields';
import { parseWith } from '../core/model/issues';
import type { SchemaResult } from '../core/model/schema';
import { z } from '../core/model/zod';
import { parseTabStatus } from '../core/render/status';

// A zod schema for the payload of every message the background answers (REQ-SEC-003). Background
// only: content scripts never load this file (size budget). Payloads carry no URL or origin; the
// background takes those from the sender (REQ-SEC-001, REQ-SEC-002).

type Parser<Data> = (data: unknown) => SchemaResult<Data>;
type Parsers<K extends BackgroundMessageType> = {
  readonly [T in K]: Parser<DataOf<BackgroundProtocol, T>>;
};

const MAX_SELECTOR = 500;
const MAX_ROUTE = 500;
/** A DNS name is at most 253 characters; the reducer checks the host itself. */
const MAX_HOSTNAME = 253;
/** Generous: the import itself refuses files over 1 MB with a readable error (importTooLarge). */
const MAX_IMPORT_TEXT = 2 * 1024 * 1024;

const parser =
  <Data>(schema: ZodType<Data>): Parser<Data> =>
  (data) =>
    parseWith(schema, data);

const noPayload = parser(z.undefined('Expected no payload'));
const tabId = z.int().min(0);
const forTab = parser(z.strictObject({ tabId }));

const elementEffects = [
  'ribbon',
  'outline',
  'tint',
  'stripes',
] as const satisfies readonly ElementEffectKind[];

const savePick = z.strictObject({
  selector: z.string().min(1).max(MAX_SELECTOR),
  siteGroupId: idSchema<SiteGroupId>().exactOptional(),
  effects: z
    .array(z.enum(elementEffects))
    .min(1)
    .refine((effects) => new Set(effects).size === effects.length, 'Each effect only once'),
  color: hexSchema,
  repickMarkId: idSchema<MarkId>().exactOptional(),
});

const markThisSite = z.strictObject({
  tabId,
  origin: z.strictObject({
    hostname: z.string().min(1).max(MAX_HOSTNAME),
    port: z.string().regex(/^\d{0,5}$/, 'Expected a port number or nothing'),
  }),
});

const importFile = { text: z.string().max(MAX_IMPORT_TEXT) };

const pageParsers: Parsers<PageMessageType> = {
  command: parseCommand,
  getState: noPayload,
  startPicker: parser(z.strictObject({ tabId, repickMarkId: idSchema<MarkId>().exactOptional() })),
  toggleHidden: forTab,
  getTabStatus: forTab,
  markThisSite: parser(markThisSite),
  importPreview: parser(z.strictObject(importFile)),
  importApply: parser(z.strictObject({ ...importFile, mode: z.enum(['merge', 'replace']) })),
};

const contentParsers: Parsers<ContentMessageType> = {
  renderPlanFor: noPayload,
  reportStatus: parseTabStatus,
  savePick: parser(savePick),
  requestGrant: noPayload,
  openOptions: parser(z.strictObject({ route: z.string().max(MAX_ROUTE) })),
};

const parsers: Parsers<BackgroundMessageType> = { ...pageParsers, ...contentParsers };

/** Every message the background answers. */
export function backgroundMessageTypes(): readonly BackgroundMessageType[] {
  return Object.keys(parsers) as BackgroundMessageType[];
}

/** Sent by extension pages (`page`) or by top-frame content scripts (`content`); else `undefined`. */
export function senderKind(type: unknown): 'page' | 'content' | undefined {
  if (typeof type !== 'string') return undefined;
  if (Object.hasOwn(pageParsers, type)) return 'page';
  return Object.hasOwn(contentParsers, type) ? 'content' : undefined;
}

/** Validates the payload of a `type` message; never throws (D-225). */
export function parsePayload<K extends BackgroundMessageType>(
  type: K,
  data: unknown,
): SchemaResult<DataOf<BackgroundProtocol, K>> {
  return parsers[type](data);
}
