import type { Mark, MarkDraft, SiteGroup } from '@/core/model/schema';
import { commandErrorText } from './command-error';
import { sendTracked } from './save-status';

/** Replaces the mark with `draft` (updateMark); resolves to the refusal text, if any. */
export async function updateMark(
  group: SiteGroup,
  mark: Mark,
  draft: MarkDraft,
): Promise<string | undefined> {
  const command = { type: 'updateMark', groupId: group.id, markId: mark.id, mark: draft } as const;
  const result = await sendTracked(command);
  return result.ok ? undefined : commandErrorText(result.error);
}
