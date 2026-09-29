import { createRateLimiter } from './rate-limit';

/** REQ-SEC-006: moving the host back to the top is rate-limited like re-attaching (10 per 10 s). */
const PROMOTE_MAX = 10;
const PROMOTE_WINDOW_MS = 10_000;

const CAPTURE: AddEventListenerOptions = { capture: true, passive: true };
/** The picker's top-layer host (src/content/picker/picker-host.ts). */
const PICKER_HOST = 'sitemark-picker';

export type TopLayerGuard = { stop(): void };

/**
 * Keeps the host above whatever the page puts in the top layer (REQ-RND-006): a popover opening
 * (`toggle`), a modal dialog (its `open` attribute) or a fullscreen element (`fullscreenchange`)
 * lands above the host, so the host leaves the top layer and enters it again. A page that closes
 * the host's popover gets it back. Both are rate-limited; a blocked move is retried later.
 */
export function keepOnTop(element: HTMLElement, wantsTop: () => boolean): TopLayerGuard {
  const limiter = createRateLimiter(PROMOTE_MAX, PROMOTE_WINDOW_MS, Date.now);
  let retry: ReturnType<typeof setTimeout> | undefined;
  const promote = () => {
    if (!wantsTop() || !element.isConnected || typeof element.showPopover !== 'function') return;
    if (!limiter.tryTake()) {
      retry ??= setTimeout(() => {
        retry = undefined;
        promote();
      }, limiter.msUntilNext());
      return;
    }
    if (element.matches(':popover-open')) element.hidePopover();
    element.showPopover();
  };
  const onToggle = (event: Event) => {
    const { newState } = event as ToggleEvent;
    // SiteMark's own picker belongs above the marks while the user picks an element.
    if (event.target instanceof Element && event.target.localName === PICKER_HOST) return;
    // Our own promotion toggles the host too: only a page closing it needs an answer.
    if (event.target === element) {
      if (newState === 'closed') promote();
      return;
    }
    // <details> fires `toggle` too, but only popovers enter the top layer.
    if (event.target instanceof Element && event.target.hasAttribute('popover')) {
      if (newState === 'open') promote();
    }
  };
  // `open` also belongs to <details>; only a dialog that opens can land above the host.
  const dialogs = new MutationObserver((records) => {
    if (records.some(({ target }) => target instanceof HTMLDialogElement && target.open)) promote();
  });
  dialogs.observe(document, { subtree: true, attributes: true, attributeFilter: ['open'] });
  document.addEventListener('toggle', onToggle, CAPTURE);
  document.addEventListener('fullscreenchange', promote, CAPTURE);
  return {
    stop() {
      dialogs.disconnect();
      document.removeEventListener('toggle', onToggle, CAPTURE);
      document.removeEventListener('fullscreenchange', promote, CAPTURE);
      clearTimeout(retry);
    },
  };
}
