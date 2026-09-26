import { adoptStyles } from './adopt-styles';
import { HOST_CSS } from './host-styles';

export type HostElement = {
  readonly element: HTMLElement;
  readonly shadow: ShadowRoot;
  readonly root: HTMLElement;
};

/**
 * Builds the detached `<sitemark-root popover="manual">` with its shadow root (`closed` in
 * production, `open` in test and e2e builds, D-226), the host sheet and the view container.
 */
export function buildHostElement(): HostElement {
  const element = document.createElement('sitemark-root');
  element.setAttribute('popover', 'manual');
  const shadow = element.attachShadow({ mode: __SHADOW_MODE__ });
  adoptStyles(shadow, [HOST_CSS]);
  const root = document.createElement('div');
  // Lets e2e tests find the container through the open shadow root (tests/e2e/marker.ts).
  root.setAttribute('data-sitemark-root', '');
  shadow.append(root);
  return { element, shadow, root };
}

/** Opens or closes the popover. Without the Popover API the z-index fallback applies (REQ-RND-006). */
export function setPopover(element: HTMLElement, open: boolean): void {
  if (typeof element.showPopover !== 'function' || !element.isConnected) return;
  if (element.matches(':popover-open') === open) return;
  if (open) element.showPopover();
  else element.hidePopover();
}
