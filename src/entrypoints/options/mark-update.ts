import type { Mark, MarkDraft, SiteGroup } from '@/core/model/schema';
import { sendCommand } from '@/ui/hooks/use-command';
import { commandErrorText } from './command-error';

/** Replaces the mark with `draft` (updateMark); resolves to the refusal text, if any. */
export async function updateMark(
  group: SiteGroup,
  mark: Mark,
  draft: MarkDraft,
): Promise<string | undefined> {
  const command = { type: 'updateMark', groupId: group.id, markId: mark.id, mark: draft } as const;
  const result = await sendCommand(command);
  return result.ok ? undefined : commandErrorText(result.error);
}
