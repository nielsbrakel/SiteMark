import { notImplemented } from '../../core/not-implemented';

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
export function createHost(_options: HostOptions = {}): Host {
  return notImplemented();
}
