import { type ReactNode, useId, useState } from 'react';
import type { Committed } from '@/app/command-queue';
import type { MessagingError } from '@/app/protocol';
import type { ErrorCode } from '@/core/errors';
import type { Result } from '@/core/result';
import { t } from '@/lib/i18n/browser-source';
import { markThisSiteClick, type PopupTab } from '@/platform/mark-this-site-click';
import { Button } from '@/ui/components/Button';
import { errorText } from './error-text';
import styles from './NoMatch.module.css';

export type NoMatchProps = {
  /** The tab the popup was opened on; Mark this site adds a group for its host. */
  readonly tab: PopupTab;
};

type MarkThisSiteReply = Result<Result<Committed, ErrorCode>, MessagingError>;

const failureOf = (reply: MarkThisSiteReply): ErrorCode | MessagingError | undefined =>
  reply.ok ? (reply.value.ok ? undefined : reply.value.error) : reply.error;

/** No site group matches the tab: offer Mark this site (REQ-POP-001, design.md §5.1 B). */
export function NoMatch({ tab }: NoMatchProps): ReactNode {
  const hintId = useId();
  const [failure, setFailure] = useState<ErrorCode | MessagingError>();
  // biome-ignore lint/security/noSecrets: a message key, not a secret.
  const hint = t('popupMarkThisSiteHint');
  const markThisSite = () => {
    // D-229: the prompt comes first and synchronously; the background adds the group whatever
    // the answer, and the popup shows it once it is stored (REQ-POP-006).
    const click = markThisSiteClick(tab);
    setFailure(undefined);
    void click?.reply.then((reply) => setFailure(failureOf(reply)));
  };
  return (
    <div className={`sm-well ${styles.noMatch}`}>
      <p className={styles.text}>{t('popupNoMatch')}</p>
      <Button variant="primary" aria-describedby={hintId} onClick={markThisSite}>
        {t('popupMarkThisSite')}
      </Button>
      <p id={hintId} className={styles.hint}>
        {hint}
      </p>
      {failure && <p role="alert">{errorText(failure)}</p>}
    </div>
  );
}
