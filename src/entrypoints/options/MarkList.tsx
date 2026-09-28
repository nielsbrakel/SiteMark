import { Fragment, type ReactNode, useId } from 'react';
import type { Command } from '@/core/commands/command';
import type { MarkId } from '@/core/ids';
import type { Mark, SiteGroup } from '@/core/model/schema';
import { t } from '@/lib/i18n/browser-source';
import { Button } from '@/ui/components/Button';
import { IconButton } from '@/ui/components/IconButton';
import { CloseIcon } from '@/ui/components/icons';
import { commandErrorText } from './command-error';
import styles from './MarkEditor.module.css';
import { newPageMark } from './mark-drafts';
import { markSummary, markSummaryParts, SEPARATOR } from './mark-summary';
import type { Notify } from './notify';
import { hrefOf } from './routes';
import { sendTracked } from './save-status';
import { useCloseFocus } from './use-close-focus';
import { useRemovalFocus } from './use-removal-focus';

export type MarkListProps = {
  readonly group: SiteGroup;
  readonly notify: Notify;
  /** The mark whose editor is open; closing it puts focus back on its Edit link. */
  readonly openMarkId?: MarkId | undefined;
  /** The children render the open mark's editor under the list. */
  readonly children?: ReactNode;
};

async function send(command: Command, notify: Notify, onDone?: () => void): Promise<void> {
  const result = await sendTracked(command);
  if (!result.ok) return notify({ text: commandErrorText(result.error) });
  onDone?.();
}

/** A mark's summary line, with its user text out of reach of page translators (REQ-I18N-003). */
function SummaryText({ mark }: { readonly mark: Mark }): ReactNode {
  return markSummaryParts(mark).map((part, index) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: the parts of one line never move.
    <Fragment key={index}>
      {index > 0 && SEPARATOR}
      {part.isUserText ? <span translate="no">{part.text}</span> : part.text}
    </Fragment>
  ));
}

/** The site group's marks (REQ-OPT-003): a line each, with Edit and Remove, and Add page mark. */
export function MarkList({ group, notify, openMarkId, children }: MarkListProps): ReactNode {
  const headingId = useId();
  const focus = useRemovalFocus(
    group.marks.map((mark) => mark.id),
    headingId,
  );
  useCloseFocus(openMarkId, focus.listRef);
  const add = () =>
    send({ type: 'addMark', groupId: group.id, mark: newPageMark(group.name) }, notify);
  return (
    <section className={styles.marks} aria-labelledby={headingId}>
      <h3 id={headingId} tabIndex={-1}>
        {t('optionsMarks')}
      </h3>
      <ul ref={focus.listRef} aria-labelledby={headingId} className={styles.list}>
        {group.marks.map((mark, index) => {
          const summary = markSummary(mark);
          const route = { page: 'mark', groupId: group.id, markId: mark.id } as const;
          const remove = { type: 'removeMark', groupId: group.id, markId: mark.id } as const;
          return (
            <li key={mark.id} className={styles.item}>
              <span data-summary className={styles.summary}>
                <SummaryText mark={mark} />
              </span>
              <a
                href={hrefOf(route)}
                data-edit={mark.id}
                aria-label={t('optionsEditMarkLink', summary)}
              >
                {t('optionsEdit')}
              </a>
              <IconButton
                data-remove
                label={t('optionsRemoveMark', summary)}
                icon={<CloseIcon />}
                onClick={() =>
                  void send(remove, notify, () => focus.removed({ id: mark.id, index }))
                }
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
