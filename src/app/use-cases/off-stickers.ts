import { notImplemented } from '../../core/not-implemented';
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
export async function showOffStickers(_deps: OffStickersDeps): Promise<void> {
  return notImplemented();
}
