import type { ReactNode } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ExternalLink } from '../components/ExternalLink';
import { rehypeHeadingIds } from './heading-ids';
import { resolveLink } from './links';
import styles from './markdown.module.css';

type MarkdownProps = {
  /** The Markdown text. */
  source: string;
  /** Its path in the repository (e.g. `PRIVACY.md`), which relative links resolve against. */
  file: string;
};

type LinkProps = { href?: string | undefined; children?: ReactNode };

function linkIn(file: string) {
  return function MarkdownLink({ href = '', children }: LinkProps) {
    // react-markdown already emptied unsafe URLs (javascript: and the like).
    const link = href ? resolveLink(href, file) : { href: '#', external: false };
    if (link.external) return <ExternalLink href={link.href}>{children}</ExternalLink>;
    return <a href={link.href}>{children}</a>;
  };
}

/**
 * Repository Markdown rendered as React elements, never as HTML strings (REQ-WEB-006): raw HTML is
 * skipped, GFM tables work, headings get anchor ids and links are made safe. Images are dropped:
 * nothing in a Markdown file may make the page load anything (REQ-WEB-003).
 */
export function Markdown({ source, file }: MarkdownProps) {
  const components: Components = { a: linkIn(file) };
  return (
    <div className={styles.prose}>
      <ReactMarkdown
        skipHtml
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHeadingIds]}
        disallowedElements={['img']}
        components={components}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
