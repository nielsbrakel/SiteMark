import type { Locale } from '../i18n/locales';
import { parseFrontMatter } from './help';

/** The "For AI agents" page (REQ-AGENT-001): front matter and the Markdown body of one locale. */
export type AgentsContent = { title: string; description: string; body: string; file: string };

// Read by the SSR build (the page is prerendered); the text never reaches the browser.
const FILES = import.meta.glob<string>('../../content/*/agents.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/** The agents page text of a locale, from website/content/<locale>/agents.md. */
export function agentsContentFor(locale: Locale): AgentsContent {
  const file = `website/content/${locale}/agents.md`;
  const parsed = parseFrontMatter(FILES[`../../content/${locale}/agents.md`] ?? '');
  if (!parsed.ok) throw new Error(`${file}: ${parsed.error}`);
  const { title, description, body } = parsed.value;
  return { title, description, body, file };
}

/** Where the Markdown twin is written, relative to the website root (REQ-AGENT-002). */
export function agentsMarkdownFile(locale: Locale): string {
  return locale === 'en' ? 'agents.md' : `${locale}/agents.md`;
}

/** The plain-Markdown twin of the agents page: the title as `# `, then the body (REQ-AGENT-002). */
export function agentsMarkdown(locale: Locale): string {
  const { title, body } = agentsContentFor(locale);
  return `# ${title}\n\n${body}`;
}
