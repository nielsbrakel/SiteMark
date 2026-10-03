import { notImplemented } from '@/core/not-implemented';
import type { Locale } from '../i18n/locales';

/** The "For AI agents" page (REQ-AGENT-001): front matter and the Markdown body of one locale. */
export type AgentsContent = { title: string; description: string; body: string; file: string };

/** The agents page text of a locale, from website/content/<locale>/agents.md. */
export function agentsContentFor(_locale: Locale): AgentsContent {
  return notImplemented();
}

/** The plain-Markdown twin of the agents page: the title as `# `, then the body (REQ-AGENT-002). */
export function agentsMarkdown(_locale: Locale): string {
  return notImplemented();
}
