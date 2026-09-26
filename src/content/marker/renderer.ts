import type { Logger } from '../../app/ports';
import { notImplemented } from '../../core/not-implemented';
import type { RenderItem, RenderPlan } from '../../core/render/render-plan';
import type { FaviconStatus, TabStatus } from '../../core/render/status';
import type {
  DrawnItem,
  EffectView,
  ViewContext,
  ViewLabels,
} from '../../shared/marker-view/effect-view';
import type { Disposer } from './disposer';
import type { Host, HostOptions } from './host';

/** Builds the view of a drawn item (`createView` from src/shared/marker-view in production). */
export type ViewFactory = (item: RenderItem, ctx: ViewContext) => EffectView | undefined;

/** The render items that change the document instead of being drawn (T-090, T-091). */
export type DocumentItem = Extract<RenderItem, { readonly effect: 'titlePrefix' | 'favicon' }>;

/** The owner of the title prefix and favicon (D-230). */
export type DocumentEffects = {
  /** The plan's current document items; `[]` strips the prefix and restores the favicon. */
  apply(items: readonly DocumentItem[]): void;
  faviconStatus(): FaviconStatus;
  /** Restores the title and favicon. */
  dispose(): void;
};

export type RendererDeps = {
  readonly createHost: (options: HostOptions) => Host;
  readonly logger: Logger;
  /** Read once per host, so an idle tab never touches i18n. */
  readonly labels: () => ViewLabels;
  readonly createView?: ViewFactory;
  readonly documentEffects?: DocumentEffects;
  /**
   * Called after a view mounted; whatever it registers on `disposer` is removed with the view
   * (e.g. the proximity fade's listeners, T-093).
   */
  readonly onViewMount?: (item: DrawnItem, view: EffectView, disposer: Disposer) => void;
  /** The tab status may have changed (a plan, a resolved element, the hidden state). */
  readonly onStatusChange?: () => void;
  /** The host went away on its own: a newer instance replaced it, or the extension is gone. */
  readonly onHostLost?: () => void;
};

export type Renderer = {
  /** Moves the tab to `plan` (keyed diff, REQ-RND-007). */
  apply(plan: RenderPlan): void;
  /** Hides or shows every mark (placeholder until T-098: only the view container). */
  setHidden(hidden: boolean): void;
  status(): TabStatus;
  /** Removes every view, the host, the document effects and all observers. Idempotent. */
  dispose(): void;
};

export function createRenderer(_deps: RendererDeps): Renderer {
  return notImplemented();
}
