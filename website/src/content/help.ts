import { err, ok, type Result } from '@/core/result';
import { type Locale, websiteLocales } from '../i18n/locales';
import { type HelpTopic, helpTopics } from '../routes/help-topics';

/** A help file's front matter (title, description, order) and its Markdown body. */
export type FrontMatter = { title: string; description: string; order: number; body: string };
export type HelpTopicContent = FrontMatter & { topic: HelpTopic; file: string };

// Read by the SSR build (the pages are prerendered); no page code, so no help text, reaches the
// browser. Keys look like `../../content/en/help/url-patterns.md`.
const FILES = import.meta.glob<string>('../../content/*/help/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const FENCE = /^---\n([\s\S]*?)\n---\n?/;
const FIELDS = ['title', 'description', 'order'] as const;

function fields(block: string): Result<Record<string, string>, string> {
  const entries: [string, string][] = [];
  for (const line of block.split('\n').filter((l) => l.trim())) {
    const match = line.match(/^([a-z]+):\s*(.+)$/);
    if (!match?.[1] || !match[2]) return err(`Not a "field: value" line: ${line}`);
    if (!(FIELDS as readonly string[]).includes(match[1])) return err(`Unknown field ${match[1]}`);
    entries.push([match[1], match[2].trim()]);
  }
  return ok(Object.fromEntries(entries));
}

/** Splits `---` front matter (title, description, order) from the Markdown body. */
export function parseFrontMatter(text: string): Result<FrontMatter, string> {
  const fence = text.match(FENCE);
  if (!fence) return err('No front matter between --- lines');
  const parsed = fields(fence[1] ?? '');
  if (!parsed.ok) return parsed;
  const { title, description, order } = parsed.value;
  if (!title || !description) return err('The front matter needs a title and a description');
  if (!order || !/^\d+$/.test(order)) return err('The order is not a whole number');
  const body = text.slice(fence[0].length).replace(/^\n+/, '');
  return ok({ title, description, order: Number(order), body });
}

/** The help file of a topic in a locale, as a path in the repository. */
const repositoryFile = (locale: Locale, topic: string) =>
  `website/content/${locale}/help/${topic}.md`;

function filesOf(locale: Locale): Map<string, string> {
  const prefix = `../../content/${locale}/help/`;
  return new Map(
    Object.entries(FILES)
      .filter(([key]) => key.startsWith(prefix))
      .map(([key, text]) => [key.slice(prefix.length, -'.md'.length), text]),
  );
}

/** What is wrong with the help files: missing, extra or invalid ones. */
export function helpContentProblems(): string[] {
  return websiteLocales().flatMap((locale) => {
    const files = filesOf(locale);
    const expected: readonly string[] = helpTopics();
    const missing = expected
      .filter((topic) => !files.has(topic))
      .map((t) => `${locale}: no ${t}.md`);
    const extra = [...files.keys()].filter((topic) => !expected.includes(topic));
    const invalid = [...files].flatMap(([topic, text]) => {
      const parsed = parseFrontMatter(text);
      return parsed.ok ? [] : [`${repositoryFile(locale, topic)}: ${parsed.error}`];
    });
    return [...missing, ...extra.map((topic) => `${locale}: ${topic}.md is no topic`), ...invalid];
  });
}

/** The help topics of a locale, in their `order`. Throws on a broken file (a build error). */
export function helpTopicsFor(locale: Locale): HelpTopicContent[] {
  const files = filesOf(locale);
  const topics = helpTopics().map((topic) => {
    const parsed = parseFrontMatter(files.get(topic) ?? '');
    if (!parsed.ok) throw new Error(`${repositoryFile(locale, topic)}: ${parsed.error}`);
    return { ...parsed.value, topic, file: repositoryFile(locale, topic) };
  });
  return topics.sort((a, b) => a.order - b.order);
}
