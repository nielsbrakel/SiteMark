import type { ReactNode } from 'react';
import { originsOfSiteGroup } from '@/core/data/origins';
import type { SiteGroup } from '@/core/model/schema';
import { t } from '@/lib/i18n/browser-source';
import { requestOrigins } from '@/platform/permissions';
import { Switch } from '@/ui/components/Switch';
import { commandErrorText } from './command-error';
import type { Notify } from './notify';
import { sendTracked } from './save-status';

async function setEnabled(group: SiteGroup, enabled: boolean, notify: Notify): Promise<void> {
  // biome-ignore lint/security/noSecrets: a command type, not a secret.
  const result = await sendTracked({ type: 'setSiteGroupEnabled', id: group.id, enabled });
  if (!result.ok) notify({ text: commandErrorText(result.error) });
}

/**
 * Turns a site group on or off, only here in the options page (REQ-GRP-003). A group needs a URL
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
  const change = (enabled: boolean) => {
    if (enabled) void requestOrigins(originsOfSiteGroup(group));
    void setEnabled(group, enabled, notify);
  };
  return (
    <Switch
      label={t('optionsEnabled')}
      checked={group.enabled}
      onChange={change}
      disabled={needsPattern && !group.enabled}
      {...(needsPattern && { description: t('errorSiteGroupNeedsPattern') })}
    />
  );
}
