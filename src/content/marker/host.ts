import { adoptStyles } from './adopt-styles';
import { isExtensionAlive } from './extension-alive';
import { buildHostElement, setPopover } from './host-element';
import { guardHost } from './host-guard';
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

/**
 * Creates the single `<sitemark-root>` host on `document.documentElement` (REQ-RND-001). The node is
 * held in this closure and never looked up in the DOM, and it is re-attached (rate-limited) when the
 * page removes it (REQ-SEC-006). A running instance is disposed first, and the host disposes itself
 * once the extension context is gone (REQ-RND-012).
 */
export function createHost(options: HostOptions = {}): Host {
  const { element, shadow, root } = buildHostElement();
  let onTop = false;
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    guard.stop();
    element.remove();
    release();
    options.onDispose?.();
  };
  const release = claimInstance(dispose);
  const guard = guardHost(element, {
    isAlive: options.isAlive ?? isExtensionAlive,
    onOrphaned: dispose,
    onReattached: () => setPopover(element, onTop),
  });
  const setOnTop = (open: boolean) => {
    onTop = open;
    setPopover(element, open);
  };

  return {
    root,
    adoptStyles: (cssTexts) => adoptStyles(shadow, cssTexts),
    show: () => setOnTop(true),
    hide: () => setOnTop(false),
    dispose,
  };
}
