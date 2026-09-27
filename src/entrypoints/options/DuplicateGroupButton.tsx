import type { ReactNode } from 'react';
import type { SiteGroup } from '@/core/model/schema';
import { t } from '@/lib/i18n/browser-source';
import { Button } from '@/ui/components/Button';
import { sendCommand } from '@/ui/hooks/use-command';
import { commandErrorText } from './command-error';
import type { Notify } from './notify';

export type DuplicateGroupButtonProps = {
  readonly group: SiteGroup;
  readonly notify: Notify;
  /** Called with the revision that added the copy, so the page can open it. */
  readonly onAdded: (revision: number) => void;
};

/**
 * Copies the site group to the bottom of the list (REQ-GRP-006). The core names it `<name> copy`,
 * gives it new IDs and keeps it off until the user turns it on and grants its sites.
 */
export function DuplicateGroupButton({
  group,
  notify,
  onAdded,
}: DuplicateGroupButtonProps): ReactNode {
  const duplicate = async () => {
    const result = await sendCommand({ type: 'duplicateSiteGroup', id: group.id });
    if (result.ok) onAdded(result.value.revision);
    else notify({ text: commandErrorText(result.error) });
  };
  return <Button onClick={() => void duplicate()}>{t('optionsDuplicateGroup')}</Button>;
}
