import { adoptStyles } from './adopt-styles';
import { HOST_CSS } from './host-styles';

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
 * held in this closure and never looked up in the DOM (REQ-SEC-006).
 */
export function createHost(options: HostOptions = {}): Host {
  const element = document.createElement('sitemark-root');
  element.setAttribute('popover', 'manual');
  const shadow = element.attachShadow({ mode: __SHADOW_MODE__ });
  adoptStyles(shadow, [HOST_CSS]);
  const root = document.createElement('div');
  shadow.append(root);
  document.documentElement.append(element);
  let disposed = false;

  return {
    root,
    adoptStyles: (cssTexts) => adoptStyles(shadow, cssTexts),
    show: () => setPopover(element, true),
    hide: () => setPopover(element, false),
    dispose() {
      if (disposed) return;
      disposed = true;
      element.remove();
      options.onDispose?.();
    },
  };
}

/** Opens or closes the popover. Without the Popover API the z-index fallback applies (REQ-RND-006). */
function setPopover(element: HTMLElement, open: boolean): void {
  if (typeof element.showPopover !== 'function' || !element.isConnected) return;
  if (element.matches(':popover-open') === open) return;
  if (open) element.showPopover();
  else element.hidePopover();
}
