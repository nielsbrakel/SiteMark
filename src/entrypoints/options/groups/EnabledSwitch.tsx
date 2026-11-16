import type { ReactNode } from 'react';
import type { SiteGroup } from '@/core/model/schema';
import { t } from '@/lib/i18n/browser-source';
import { Switch } from '@/ui/components/Switch';
import { setGroupEnabled } from '@/ui/set-group-enabled';
import { commandErrorText } from '../command-error';
import type { Notify } from '../notify';
import { sendTracked } from '../save-status';

/**
 * Turns a site group on or off (REQ-GRP-003; the popup has the same switch, D-302). A group needs a URL
 * pattern to be on (REQ-GRP-002). Turning it on prompts for its sites first and synchronously in
 * the click (D-229); the group is turned on whatever the answer, and its patterns show the grant.
 */
export function EnabledSwitch({
  group,
  notify,
}: {
  readonly group: SiteGroup;
  readonly notify: Notify;
}): ReactNode {
  const needsPattern = group.patterns.length === 0;
  const change = (enabled: boolean) =>
    void setGroupEnabled(group, enabled, sendTracked).then((result) => {
      if (!result.ok) notify({ text: commandErrorText(result.error) });
    });
  return (
    <Switch
      label={t('optionsEnabled')}
      onText={t('optionsGroupOn')}
      offText={t('optionsGroupOff')}
      checked={group.enabled}
      onChange={change}
      spread
      disabled={needsPattern && !group.enabled}
      {...(needsPattern && { description: t('errorSiteGroupNeedsPattern') })}
    />
  );
}
