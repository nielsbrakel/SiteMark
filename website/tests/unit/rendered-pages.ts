import { type RenderedPage, renderPages } from '../../src/entry-server';

/** Every prerendered page, as the build writes it (with stand-in asset names). */
export function prerenderedPages(): Promise<RenderedPage[]> {
  return renderPages({ script: 'assets/entry-client.js', styles: ['assets/entry-client.css'] });
}

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

/** Every start tag `<name …>` in the HTML, as a map of lowercase attribute names to values. */
export function tags(html: string, name: string): Record<string, string>[] {
  const pattern = new RegExp(`<${name}\\b([^>]*?)/?>`, 'gi');
  return [...html.matchAll(pattern)].map((match) =>
    Object.fromEntries(
      [...(match[1] ?? '').matchAll(/([\w:-]+)(?:="([^"]*)")?/g)].map((attribute) => [
        (attribute[1] ?? '').toLowerCase(),
        decode(attribute[2] ?? ''),
      ]),
    ),
  );
}

/** The `content` of `<meta name|property="key">`. */
export function metaContent(html: string, key: string): string | undefined {
  return tags(html, 'meta').find((meta) => meta.name === key || meta.property === key)?.content;
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
