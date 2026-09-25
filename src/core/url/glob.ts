/**
 * Glob match where `*` is any run of characters (including `/`) and everything else is literal and
 * case-sensitive. Linear and non-backtracking, no RegExp (REQ-URL-010): the first literal segment
 * must be a prefix, the last a suffix, and each middle segment is taken at its leftmost occurrence
 * after the previous one. With only `*` wildcards the leftmost choice is always safe, so the text
 * is scanned once, from left to right.
 */
export function matchGlob(pattern: string, text: string): boolean {
  const segments = pattern.split('*');
  const first = segments[0] ?? '';
  if (segments.length === 1) return text === pattern;
  const last = segments.at(-1) ?? '';
  if (!text.startsWith(first)) return false;
  const end = text.length - last.length;
  if (end < first.length || !text.endsWith(last)) return false;
  let position = first.length;
  for (const segment of segments.slice(1, -1)) {
    const found = text.indexOf(segment, position);
    if (found < 0 || found + segment.length > end) return false;
    position = found + segment.length;
  }
  return true;
}
