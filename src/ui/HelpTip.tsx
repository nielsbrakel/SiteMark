import type { ReactNode } from 'react';
import { type MessageKey, t } from '@/lib/i18n/browser-source';
import { type HelpTopic, helpUrl } from '@/lib/site-links';
import { BookIcon } from '@/ui/components/icons';
import styles from './HelpTip.module.css';

export type HelpTipProps = {
  readonly topic: HelpTopic;
  /** The sentence before the link. */
  readonly text: MessageKey;
  /** The link text. */
  readonly link: MessageKey;
};

/** One quiet line under a label: a sentence and a link to the matching help topic. */
export function HelpTip({ topic, text, link }: HelpTipProps): ReactNode {
  return (
    <p className={styles.tip}>
      <BookIcon />
      <span>
        {t(text)}{' '}
        <a href={helpUrl(topic)} target="_blank" rel="noopener noreferrer">
          {t(link)}
        </a>
      </span>
    </p>
  );
}
