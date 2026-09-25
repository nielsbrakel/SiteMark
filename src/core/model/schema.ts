import type { Brand, MarkId, PatternId, SiteGroupId } from '../ids';
import type { Result } from '../result';
import { hexSchema } from './fields';
import { siteGroupSchema } from './group-schema';
import { parseWith } from './issues';
import { markDraftSchema, markSchema } from './mark-schema';
import { urlPatternSchema } from './pattern-schema';
import { stateSchema } from './state-schema';

// The data model (spec §7, normative; D-223). Everything read from storage, messages or imports is
// `unknown` until one of the parse functions below accepts it.

/** `^#[0-9a-f]{6}$`, lowercased on input. */
export type Hex = Brand<string, 'Hex'>;
/** `^(\*|https?)://(\*\.)?host(:port)?/\*$`, never broad (the URL engine checks breadth). */
export type OriginPattern = Brand<string, 'OriginPattern'>;

export type Theme = 'system' | 'light' | 'dark';

export type SiteMarkState = {
  schemaVersion: 1;
  /** +1 per applied command. */
  revision: number;
  /** ≤ 200; order = priority (index 0 = highest). */
  siteGroups: SiteGroup[];
  settings: { theme: Theme };
};

export type SiteGroup = {
  id: SiteGroupId;
  /** 1..40 characters after stripping control, format and bidi characters and trimming. */
  name: string;
  /** true ⇒ patterns.length ≥ 1 */
  enabled: boolean;
  /** 0..50 */
  patterns: UrlPattern[];
  /** 0..50 (REQ-URL-008) */
  excludes: UrlPattern[];
  /** 0..50 */
  marks: Mark[];
};

export type WildcardPattern = { id: PatternId; kind: 'wildcard'; value: string };
export type RegexPattern = {
  id: PatternId;
  kind: 'regex';
  value: string;
  /** 1..20 */
  origins: OriginPattern[];
};
/** Wildcard: ≤ 500 characters and ≤ 10 `*`. Regex: ≤ 500 characters, safe subset, 1..20 origins. */
export type UrlPattern = WildcardPattern | RegexPattern;

export type Mark = PageMark | ElementMark;

export type MarkBase = {
  id: MarkId;
  /** ≤ 40, shown in the UI only. */
  label?: string;
  enabled: boolean;
  color: Hex;
  textColor: 'auto' | Hex;
};

export type PageMark = MarkBase & {
  target: { kind: 'page' };
  /** ≥ 1 key */
  effects: PageEffects;
};

export type ElementMark = MarkBase & {
  /** selector: 1..500 characters; the first match is marked. */
  target: { kind: 'element'; selector: string };
  /** ≥ 1 key */
  effects: ElementEffects;
};

/** A mark before the background gives it an ID (the addMark and updateMark commands). */
export type MarkDraft = Omit<PageMark, 'id'> | Omit<ElementMark, 'id'>;

export type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export type Ribbon = {
  /** 1..16 */
  text: string;
  corner: Corner;
};

export type PageEffects = {
  ribbon?: Ribbon;
  /** text 1..60 */
  banner?: { text: string; edge: 'top' | 'bottom'; size: 'compact' | 'regular' };
  /** widthPx 2..16 */
  frame?: { widthPx: number };
  /** opacityPct 3..15 */
  tint?: { opacityPct: number };
  /** opacityPct 5..40 */
  stripes?: { opacityPct: number; area: 'edge' | 'full' };
  /** text 1..24, opacityPct 4..12 */
  watermark?: { text: string; opacityPct: number };
  /** text 1..16 */
  titlePrefix?: { text: string };
  /** Presence = on. */
  favicon?: Record<string, never>;
};

export type ElementEffects = {
  ribbon?: Ribbon;
  /** widthPx 1..8 */
  outline?: { widthPx: number; style: 'solid' | 'dashed' | 'dotted'; pulse: boolean };
  /** opacityPct 5..40 */
  tint?: { opacityPct: number };
  /** opacityPct 5..40 */
  stripes?: { opacityPct: number };
};

/** One problem in untrusted input, e.g. `{ path: 'siteGroups[2].name', message: '…' }`. */
export type SchemaIssue = { readonly path: string; readonly message: string };
export type SchemaResult<T> = Result<T, SchemaIssue[]>;

/** Validates a whole stored or imported state (REQ-SEC-004). */
export function parseState(input: unknown): SchemaResult<SiteMarkState> {
  return parseWith(stateSchema, input);
}

export function parseSiteGroup(input: unknown): SchemaResult<SiteGroup> {
  return parseWith(siteGroupSchema, input);
}

/** A page or element mark with effects that fit its target (REQ-MARK-001, REQ-MARK-014). */
export function parseMark(input: unknown): SchemaResult<Mark> {
  return parseWith(markSchema, input);
}

/** A mark without an ID, checked like `parseMark` (REQ-MARK-001, REQ-MARK-014). */
export function parseMarkDraft(input: unknown): SchemaResult<MarkDraft> {
  return parseWith(markDraftSchema, input);
}

/** Checks the shape and limits only; the URL engine validates the pattern itself. */
export function parseUrlPattern(input: unknown): SchemaResult<UrlPattern> {
  return parseWith(urlPatternSchema, input);
}

/** Accepts `#rrggbb` in any case and returns it lowercased (REQ-MARK-012). */
export function parseHex(input: unknown): SchemaResult<Hex> {
  return parseWith(hexSchema, input);
}
