import { notImplemented } from '../../core/not-implemented';

export type ResolverOptions = {
  /** A target was found, lost or replaced after a DOM change (not called by `watch`). */
  readonly onChange: () => void;
  /** Every batch of DOM mutations, e.g. to re-measure the targets (the tracker). */
  readonly onMutation?: () => void;
  readonly doc?: Document;
  /** How long mutations are coalesced before missing selectors are retried (REQ-RND-005). */
  readonly retryMs?: number;
};

export type ElementResolver = {
  /** Sets the selectors to resolve (duplicates are fine) and resolves them at once. */
  watch(selectors: readonly string[]): void;
  /** The first element that matches `selector`, or `undefined` while none does. */
  targetOf(selector: string): Element | undefined;
  /** Disconnects the observer and cancels a pending retry. */
  dispose(): void;
};

export function createElementResolver(_options: ResolverOptions): ElementResolver {
  return notImplemented();
}
