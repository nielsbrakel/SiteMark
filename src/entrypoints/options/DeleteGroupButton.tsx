import { type ReactNode, useState } from 'react';
import type { SiteGroup } from '@/core/model/schema';
import { t } from '@/lib/i18n/browser-source';
import { Button } from '@/ui/components/Button';
import { Dialog } from '@/ui/components/Dialog';
import { sendCommand } from '@/ui/hooks/use-command';
import { commandErrorText } from './command-error';
import { type Notify, UNDO_MS } from './notify';

export type DeleteGroupButtonProps = {
  readonly group: SiteGroup;
  /** The group's place in the list, where Undo puts it back. */
  readonly index: number;
  readonly notify: Notify;
};

async function restore(group: SiteGroup, index: number, notify: Notify): Promise<void> {
  const result = await sendCommand({ type: 'restoreSiteGroup', group, index });
  if (!result.ok) notify({ text: commandErrorText(result.error) });
}

async function remove({ group, index, notify }: DeleteGroupButtonProps): Promise<void> {
  const result = await sendCommand({ type: 'deleteSiteGroup', id: group.id });
  if (!result.ok) return notify({ text: commandErrorText(result.error) });
  notify({
    text: t('optionsGroupDeleted', group.name),
    action: { label: t('optionsUndo'), onAction: () => void restore(group, index, notify) },
    durationMs: UNDO_MS,
  });
}

/** Deletes a site group after confirmation, with Undo for 10 s (REQ-GRP-001). */
export function DeleteGroupButton(props: DeleteGroupButtonProps): ReactNode {
  const [isConfirming, setConfirming] = useState(false);
  const confirm = () => {
    setConfirming(false);
    void remove(props);
  };
  const actions = (
    <>
      <Button onClick={() => setConfirming(false)}>{t('optionsCancel')}</Button>
      <Button variant="primary" onClick={confirm}>
        {t('optionsDelete')}
      </Button>
    </>
  );
  return (
    <>
      <Button onClick={() => setConfirming(true)}>{t('optionsDeleteGroup')}</Button>
      <Dialog
        open={isConfirming}
        onClose={() => setConfirming(false)}
        title={t('optionsDeleteGroupTitle', props.group.name)}
        actions={actions}
      >
        <p>{t('optionsDeleteGroupBody')}</p>
      </Dialog>
    </>
  );
}
