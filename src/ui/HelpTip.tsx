import type { ReactNode } from 'react';
import { notImplemented } from '@/core/not-implemented';
import type { MessageKey } from '@/lib/i18n/browser-source';
import type { HelpTopic } from '@/lib/site-links';

export type HelpTipProps = {
  readonly topic: HelpTopic;
  /** The sentence before the link. */
  readonly text: MessageKey;
  /** The link text. */
  readonly link: MessageKey;
};

/** One quiet line under a label: a sentence and a link to the matching help topic. */
export function HelpTip(_props: HelpTipProps): ReactNode {
  return notImplemented();
}
