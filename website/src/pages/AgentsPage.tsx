import { agentsContentFor } from '../content/agents';
import { Markdown } from '../content/markdown';
import type { PageProps } from './page-props';

/** "For AI agents" (REQ-AGENT-001): the title as the h1, then the Markdown, prerendered. */
export function AgentsPage({ locale }: PageProps) {
  const { title, body, file } = agentsContentFor(locale);
  return (
    <article>
      <h1>{title}</h1>
      <Markdown source={body} file={file} />
    </article>
  );
}
