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

const RETRY_MS = 200;
const OBSERVE: MutationObserverInit = { childList: true, subtree: true, attributes: true };

/** The first match (D-206); an invalid selector matches nothing and never throws. */
function firstMatch(doc: Document, selector: string): Element | undefined {
  try {
    return doc.querySelector(selector) ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * Resolves element-mark selectors to their first match (REQ-RND-005, D-206). While a selector is
 * missing, DOM mutations schedule a retry 200 ms later; mutations in the meantime join that retry,
 * so a busy page still gets one every 200 ms. A found target stays put until it leaves the
 * document, and then every selector is resolved again at once.
 */
export function createElementResolver(options: ResolverOptions): ElementResolver {
  const doc = options.doc ?? document;
  const retryMs = options.retryMs ?? RETRY_MS;
  const targets = new Map<string, Element | undefined>();
  let retry: ReturnType<typeof setTimeout> | undefined;

  const resolveAll = (): boolean => {
    let changed = false;
    for (const [selector, before] of targets) {
      const after = before?.isConnected ? before : firstMatch(doc, selector);
      changed ||= after !== before;
      targets.set(selector, after);
    }
    return changed;
  };
  const refresh = () => {
    retry = undefined;
    if (resolveAll()) options.onChange();
  };
  const hasMissing = () => [...targets.values()].some((target) => target === undefined);
  const hasRemoved = () => [...targets.values()].some((target) => target && !target.isConnected);
  const onMutations = () => {
    options.onMutation?.();
    if (hasRemoved()) {
      clearTimeout(retry);
      return refresh();
    }
    if (hasMissing()) retry ??= setTimeout(refresh, retryMs);
  };
  const observer = new MutationObserver(onMutations);
  const stop = () => {
    observer.disconnect();
    clearTimeout(retry);
    retry = undefined;
  };

  return {
    watch(selectors) {
      stop();
      const before = new Map(targets);
      targets.clear();
      for (const selector of selectors) targets.set(selector, before.get(selector));
      resolveAll();
      if (targets.size > 0) observer.observe(doc, OBSERVE);
    },
    targetOf: (selector) => targets.get(selector),
    dispose() {
      stop();
      targets.clear();
    },
  };
}
