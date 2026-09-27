import type { RegexErrorCode, UrlPatternErrorCode } from '@/core/errors';
import { assertNever } from '@/core/result';
import { normalizeUrlPattern, type UrlPatternDraft } from '@/core/url/match';
import { type OriginPattern, parseOriginPattern, validateRegexOrigins } from '@/core/url/origin';
import { validateRegex } from '@/core/url/regex-safety';

// What the Add button checks before it prompts (REQ-URL-003, REQ-URL-004, REQ-URL-009). The
// background checks again; checking here first puts the reason next to the right field and never
// prompts for a pattern that can't be stored.

export type PatternKind = UrlPatternDraft['kind'];

export type PatternInput = {
  readonly kind: PatternKind;
  readonly value: string;
  /** Comma-separated origins, for a regex. */
  readonly origins: string;
};

export type DraftCheck =
  | { readonly ok: true; readonly draft: UrlPatternDraft; readonly origins: OriginPattern[] }
  | {
      readonly ok: false;
      readonly field: 'pattern' | 'origins';
      readonly code: UrlPatternErrorCode | RegexErrorCode;
    };

function splitOrigins(text: string): string[] {
  return text
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function checkWildcard(value: string): DraftCheck {
  const normalized = normalizeUrlPattern({ kind: 'wildcard', value });
  const origin = normalized.ok ? parseOriginPattern(normalized.value.value) : normalized;
  if (!origin.ok) return { ok: false, field: 'pattern', code: origin.error };
  return { ok: true, draft: { kind: 'wildcard', value }, origins: [origin.value] };
}

function checkRegex(value: string, originsText: string): DraftCheck {
  const source = validateRegex(value);
  if (!source.ok) return { ok: false, field: 'pattern', code: source.error };
  const origins = splitOrigins(originsText);
  const valid = validateRegexOrigins(origins);
  if (!valid.ok) return { ok: false, field: 'origins', code: valid.error };
  return { ok: true, draft: { kind: 'regex', value, origins }, origins: valid.value };
}

/** The draft to send and the origins to prompt for, or the field and code that refuse it. */
export function checkPatternInput({ kind, value, origins }: PatternInput): DraftCheck {
  switch (kind) {
    case 'wildcard':
      return checkWildcard(value);
    case 'regex':
      return checkRegex(value, origins);
    default:
      return assertNever(kind);
  }
}
