// Small HTML readers for tests on prerendered pages (unit tests and the build tests alike).
// The pages come from React's renderer, so double-quoted attributes are all there is to parse.

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#x27;': "'",
};

/** Text as the browser reads it from an attribute or a text node. */
export function decode(text: string): string {
  return text.replace(/&(amp|lt|gt|quot|#x27);/g, (entity) => ENTITIES[entity] ?? entity);
}

export type Tag = { name: string; attributes: Record<string, string> };

function attributesOf(source: string): Record<string, string> {
  return Object.fromEntries(
    [...source.matchAll(/([^\s=/>]+)(?:="([^"]*)")?/g)].map((attribute) => [
      (attribute[1] ?? '').toLowerCase(),
      decode(attribute[2] ?? ''),
    ]),
  );
}

/** Every start tag in the HTML, in document order. */
export function allTags(html: string): Tag[] {
  return [...html.matchAll(/<([a-zA-Z][\w-]*)((?:\s+[^\s=/>]+(?:="[^"]*")?)*)\s*\/?>/g)].map(
    (match) => ({ name: (match[1] ?? '').toLowerCase(), attributes: attributesOf(match[2] ?? '') }),
  );
}

/** The attributes of every `<name …>` start tag. */
export function tags(html: string, name: string): Record<string, string>[] {
  return allTags(html)
    .filter((tag) => tag.name === name)
    .map((tag) => tag.attributes);
}

/** The `content` of `<meta name|property="key">`. */
export function metaContent(html: string, key: string): string | undefined {
  return tags(html, 'meta').find((meta) => meta.name === key || meta.property === key)?.content;
}

/** The `content` of `<meta http-equiv="Content-Security-Policy">`. */
export function cspOf(html: string): string | undefined {
  return tags(html, 'meta').find(
    (meta) => meta['http-equiv']?.toLowerCase() === 'content-security-policy',
  )?.content;
}

/** The text of the `<title>` element. */
export function titleOf(html: string): string | undefined {
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1];
  return title === undefined ? undefined : decode(title);
}

/** The locale from `<html lang>`. */
export function langOf(html: string): string | undefined {
  return tags(html, 'html')[0]?.lang;
}

/** `<script>` elements: their attributes and their (raw) text. */
export function scriptsOf(html: string): { attributes: Record<string, string>; text: string }[] {
  return [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].map((match) => ({
    attributes: attributesOf(match[1] ?? ''),
    text: match[2] ?? '',
  }));
}
