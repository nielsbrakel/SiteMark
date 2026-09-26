import type { RenderItem } from '../../core/render/render-plan';
import { createTitlePrefix } from './title-prefix';

type TitlePrefixItem = Extract<RenderItem, { effect: 'titlePrefix' }>;

/**
 * The single owner of the two page mutations outside the host (D-230): the title prefix
 * (REQ-MARK-009) and the favicon tint (REQ-MARK-010). The renderer hands it every plan.
 */
export type DocumentEffects = {
  /** Applies the plan's title prefix and favicon items; other items are ignored. */
  apply(items: readonly RenderItem[]): void;
  /** Takes both effects off the page (hide on this tab, empty plan). */
  clear(): void;
  /** `clear()` and stop watching the page. */
  dispose(): void;
};

const isTitlePrefix = (item: RenderItem): item is TitlePrefixItem =>
  item.target === 'page' && item.effect === 'titlePrefix';

export function createDocumentEffects(): DocumentEffects {
  const title = createTitlePrefix();
  const clear = () => title.remove();
  return {
    apply(items) {
      const item = items.find(isTitlePrefix);
      if (item) title.apply(item.params.text);
      else title.remove();
    },
    clear,
    dispose: clear,
  };
}
