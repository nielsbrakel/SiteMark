import { notImplemented } from '../../core/not-implemented';
import type { RenderItem } from '../../core/render/render-plan';

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

export function createDocumentEffects(): DocumentEffects {
  return notImplemented();
}
