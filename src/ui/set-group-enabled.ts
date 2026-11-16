import type { Committed } from '@/app/command-queue';
import type { Command } from '@/core/commands/command';
import { originsOfSiteGroup } from '@/core/data/origins';
import type { SiteGroup } from '@/core/model/schema';
import type { Result } from '@/core/result';
import { requestOrigins } from '@/platform/permissions';
import type { CommandError } from './hooks/use-command';

/**
 * Turns a site group on or off (REQ-GRP-003). Call it synchronously in the click: turning it on
 * prompts for its sites first (D-229), and the group is turned on whatever the answer.
 */
export function setGroupEnabled(
  group: SiteGroup,
  enabled: boolean,
  send: (command: Command) => Promise<Result<Committed, CommandError>>,
): Promise<Result<Committed, CommandError>> {
  if (enabled) void requestOrigins(originsOfSiteGroup(group));
  // biome-ignore lint/security/noSecrets: a command type, not a secret.
  return send({ type: 'setSiteGroupEnabled', id: group.id, enabled });
}
