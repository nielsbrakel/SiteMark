import type { RenderItem } from '../../core/render/render-plan';
import type { FaviconStatus } from '../../core/render/status';
import { createFaviconTint } from './favicon-tint';
import { createTitlePrefix } from './title-prefix';

type TitlePrefixItem = Extract<RenderItem, { effect: 'titlePrefix' }>;
type FaviconItem = Extract<RenderItem, { effect: 'favicon' }>;

const FAVICON_TIMEOUT_MS = 3000;

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
  /**
   * The favicon tint's settled status: `off` without a favicon item (or while the original
   * is still loading), else `available` or `unavailable` (REQ-MARK-010).
   */
  faviconStatus(): FaviconStatus;
};

export type DocumentEffectsOptions = {
  /** Called when the favicon status changes, e.g. once the original favicon has loaded. */
  readonly onFaviconStatus?: (status: FaviconStatus) => void;
  /** How long the original favicon may take to load (default 3 s). */
  readonly faviconTimeoutMs?: number;
};

const isTitlePrefix = (item: RenderItem): item is TitlePrefixItem =>
  item.target === 'page' && item.effect === 'titlePrefix';
const isFavicon = (item: RenderItem): item is FaviconItem =>
  item.target === 'page' && item.effect === 'favicon';

export function createDocumentEffects(options: DocumentEffectsOptions = {}): DocumentEffects {
  let status: FaviconStatus = 'off';
  const setStatus = (next: FaviconStatus) => {
    if (next === status) return;
    status = next;
    options.onFaviconStatus?.(next);
  };
  const title = createTitlePrefix();
  const favicon = createFaviconTint(setStatus, options.faviconTimeoutMs ?? FAVICON_TIMEOUT_MS);
  const removeFavicon = () => {
    favicon.remove();
    setStatus('off');
  };
  const clear = () => {
    title.remove();
    removeFavicon();
  };
  return {
    apply(items) {
      const prefix = items.find(isTitlePrefix);
      if (prefix) title.apply(prefix.params.text);
      else title.remove();
      const tint = items.find(isFavicon);
      if (tint) favicon.apply(tint.color);
      else removeFavicon();
    },
    clear,
    dispose: clear,
    faviconStatus: () => status,
  };
}
