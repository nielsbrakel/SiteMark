import { activeGroups } from '../../core/url/group-match';
import { hasOffGroup } from '../../core/url/off-groups';
import type { Badge, StateRepo, Tabs } from '../ports';

export type OffStickersDeps = {
  readonly badge: Badge;
  readonly tabs: Pick<Tabs, 'list'>;
  readonly stateRepo: Pick<StateRepo, 'load'>;
};

/**
 * The tabs that run no marker (every matching group is off) get the grey sticker, and tabs where no
 * group matches the plain icon (REQ-POP-010). Tabs with an active group are left to their marker's
 * reports, and read-only data keeps its attention stickers (REQ-DATA-007).
 */
export async function showOffStickers(deps: OffStickersDeps): Promise<void> {
  const { mode, state } = await deps.stateRepo.load();
  if (mode === 'readOnly') return;
  const tabs = await deps.tabs.list();
  await Promise.all(
    tabs.map(async ({ id, url }) => {
      if (url === undefined || activeGroups(state, url).length > 0) return;
      await deps.badge.setState(id, hasOffGroup(state, url) ? 'hidden' : 'none');
    }),
  );
}
