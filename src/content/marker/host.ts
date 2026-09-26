import { adoptStyles } from './adopt-styles';
import { isExtensionAlive } from './extension-alive';
import { buildHostElement, setPopover } from './host-element';
import { claimInstance } from './singleton';

export type HostOptions = {
  /** Called once when the host goes away: dispose(), a newer instance, or the orphan check. */
  readonly onDispose?: () => void;
  /** False once the extension context is gone (updated or removed): the host disposes itself. */
  readonly isAlive?: () => boolean;
};

export type Host = {
  /** Container inside the shadow root. Effect views mount here. */
  readonly root: HTMLElement;
  /** Adds style sheets to the shadow root: adopted sheets where possible, else `<style>` (D-232). */
  adoptStyles(cssTexts: readonly string[]): void;
  /** Promotes the host to the top layer (`showPopover`). Remembered across re-attaches. */
  show(): void;
  /** Leaves the top layer (`hidePopover`). The host stays in the page with its z-index fallback. */
  hide(): void;
  /** Removes the host node and every observer and timer. Idempotent. */
  dispose(): void;
};

/** How often an idle host checks whether its extension context is still alive. */
const ORPHAN_CHECK_MS = 1000;

/**
 * Creates the single `<sitemark-root>` host on `document.documentElement` (REQ-RND-001). The node is
 * held in this closure and never looked up in the DOM (REQ-SEC-006). A running instance is disposed
 * first, and the host disposes itself once the extension context is gone (REQ-RND-012).
 */
export function createHost(options: HostOptions = {}): Host {
  const isAlive = options.isAlive ?? isExtensionAlive;
  const { element, shadow, root } = buildHostElement();
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    observer.disconnect();
    clearInterval(orphanTimer);
    element.remove();
    release();
    options.onDispose?.();
  };
  const release = claimInstance(dispose);
  const checkAlive = () => {
    if (!isAlive()) dispose();
  };
  // A newer instance adding its own host is a mutation too, so an orphan leaves at once.
  const observer = new MutationObserver(checkAlive);
  observer.observe(document.documentElement, { childList: true });
  const orphanTimer = setInterval(checkAlive, ORPHAN_CHECK_MS);
  document.documentElement.append(element);

  return {
    root,
    adoptStyles: (cssTexts) => adoptStyles(shadow, cssTexts),
    show: () => setPopover(element, true),
    hide: () => setPopover(element, false),
    dispose,
  };
}
