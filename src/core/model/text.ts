/**
 * Control (Cc), format (Cf: bidi overrides and isolates, zero-width characters, BOM), lone
 * surrogates (Cs) and line/paragraph separators. None of them belongs in a label (REQ-SEC-004).
 */
const INVISIBLE = /[\p{Cc}\p{Cf}\p{Cs}\p{Zl}\p{Zp}]/gu;

/** User text as stored: invisible and bidi characters removed, then trimmed. */
export function cleanText(text: string): string {
  return text.replace(INVISIBLE, '').trim();
}
