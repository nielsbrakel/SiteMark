// Cheap checks on untrusted JSON text that run before `JSON.parse` (REQ-DATA-004, REQ-SEC-004).

/** UTF-8 bytes of one code point; a lone surrogate counts as U+FFFD (3 bytes), like TextEncoder. */
function utf8Bytes(codePoint: number): number {
  if (codePoint < 0x80) return 1;
  if (codePoint < 0x800) return 2;
  return codePoint < 0x10000 ? 3 : 4;
}

/**
 * Is `text` at most `maxBytes` long in UTF-8? Core has no TextEncoder, so the bytes are counted per
 * code point. A UTF-16 code unit takes 1 to 3 bytes (a surrogate pair takes 4 for 2 units), which
 * decides most texts from their length alone.
 */
export function fitsUtf8Bytes(text: string, maxBytes: number): boolean {
  if (text.length > maxBytes) return false;
  if (text.length * 3 <= maxBytes) return true;
  let bytes = 0;
  for (const char of text) {
    bytes += utf8Bytes(char.codePointAt(0) ?? 0);
    if (bytes > maxBytes) return false;
  }
  return true;
}

/** The index of the quote that closes the string opened at `start` (or the end of the text). */
function endOfString(text: string, start: number): number {
  for (let index = start + 1; index < text.length; index += 1) {
    const char = text[index];
    if (char === '\\') index += 1;
    else if (char === '"') return index;
  }
  return text.length;
}

/**
 * Do arrays and objects nest deeper than `maxDepth` anywhere in `text`? Brackets inside strings don't
 * count. Checked before `JSON.parse`, so hostile nesting never reaches the parser or the schemas.
 * Unbalanced text may be miscounted, but `JSON.parse` rejects it at the first stray bracket.
 */
export function isNestedDeeperThan(text: string, maxDepth: number): boolean {
  let depth = 0;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      index = endOfString(text, index);
    } else if (char === '[' || char === '{') {
      depth += 1;
      if (depth > maxDepth) return true;
    } else if (char === ']' || char === '}') {
      depth -= 1;
    }
  }
  return false;
}
