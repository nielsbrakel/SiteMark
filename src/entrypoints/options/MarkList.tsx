import { type ReactNode, useId } from 'react';
import type { Command } from '@/core/commands/command';
import type { SiteGroup } from '@/core/model/schema';
import { t } from '@/lib/i18n/browser-source';
import { Button } from '@/ui/components/Button';
import { IconButton } from '@/ui/components/IconButton';
import { CloseIcon } from '@/ui/components/icons';
import { sendCommand } from '@/ui/hooks/use-command';
import { commandErrorText } from './command-error';
import styles from './MarkEditor.module.css';
import { newPageMark } from './mark-drafts';
import { markSummary } from './mark-summary';
import type { Notify } from './notify';
import { hrefOf } from './routes';

export type MarkListProps = {
  readonly group: SiteGroup;
  readonly notify: Notify;
  /** The children render the open mark's editor under the list. */
  readonly children?: ReactNode;
};

async function send(command: Command, notify: Notify): Promise<void> {
  const result = await sendCommand(command);
  if (!result.ok) notify({ text: commandErrorText(result.error) });
}

/** The site group's marks (REQ-OPT-003): a line each, with Edit and Remove, and Add page mark. */
export function MarkList({ group, notify, children }: MarkListProps): ReactNode {
  const headingId = useId();
  const add = () =>
    send({ type: 'addMark', groupId: group.id, mark: newPageMark(group.name) }, notify);
  return (
    <section className={styles.marks} aria-labelledby={headingId}>
      <h3 id={headingId}>{t('optionsMarks')}</h3>
      <ul aria-labelledby={headingId} className={styles.list}>
        {group.marks.map((mark) => {
          const summary = markSummary(mark);
          const route = { page: 'mark', groupId: group.id, markId: mark.id } as const;
          const remove = { type: 'removeMark', groupId: group.id, markId: mark.id } as const;
          return (
            <li key={mark.id} className={styles.item}>
              <span data-summary className={styles.summary}>
                {summary}
              </span>
              <a href={hrefOf(route)} aria-label={t('optionsEditMarkLink', summary)}>
                {t('optionsEdit')}
              </a>
              <IconButton
                label={t('optionsRemoveMark', summary)}
                icon={<CloseIcon />}
                onClick={() => void send(remove, notify)}
              />
            </li>
          );
        })}
      </ul>
      <Button onClick={() => void add()}>{t('optionsAddPageMark')}</Button>
      {children}
    </section>
  );
}
