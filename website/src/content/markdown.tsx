import type { ReactNode } from 'react';
import { notImplemented } from '@/core/not-implemented';

type MarkdownProps = {
  /** The Markdown text. */
  source: string;
  /** Its path in the repository (e.g. `PRIVACY.md`), which relative links resolve against. */
  file: string;
};

/** Repository Markdown rendered as React elements, never as HTML strings (REQ-WEB-006). */
export function Markdown(_props: MarkdownProps): ReactNode {
  return notImplemented();
}
