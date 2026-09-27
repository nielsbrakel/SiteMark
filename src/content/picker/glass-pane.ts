import { elementAt } from './candidate';
import { GLASS_PANE_CSS } from './glass-pane-css';
import { drawHighlight, type PaneLabels } from './highlight';
import { captureFocus, listenForKeys, type PaneKey } from './pane-focus';
import { PANEL_CSS } from './panel-css';
import { createPart, createPickerHost } from './picker-host';

// The glass pane (D-240, REQ-PICK-002, REQ-PICK-003): the picker's own top-layer host covers the
// viewport and takes every pointer event, so no page handler runs while the user points and clicks.
// Targets come from `elementsFromPoint`. Only trusted input counts (REQ-SEC-005), and the pane
// stops each event at its own element, so the page's bubbling listeners never see it either.

/** What the pane reports; only trusted input reaches these (REQ-SEC-005). */
export type PaneHooks = {
  /** The pointer moved onto another page element. */
  readonly onHover: (element: Element) => void;
  /** A click on a page element. */
  readonly onSelect: (element: Element) => void;
  /** ↑ ↓ ← →, Enter or Esc while the pane has the focus. */
  readonly onKey: (key: PaneKey) => void;
};

export type GlassPane = {
  /** The picker's container in the shadow root, where the mini panel goes. */
  readonly root: HTMLElement;
  /** Outlines the element and shows its tooltip; `null` hides both. */
  highlight(element: Element | null): void;
  /** Removes the pane and its listeners. Idempotent. */
  dispose(): void;
};

/** Pointer input the pane swallows, so it never reaches the page's bubbling listeners. */
const SWALLOWED = [
  'pointerdown',
  'pointerup',
  'mousedown',
  'mouseup',
  'mousemove',
  'dblclick',
  'auxclick',
  'contextmenu',
] as const;

function swallow(event: Event): void {
  event.stopPropagation();
  // No focus change, text selection or context menu behind the pane.
  if (event.cancelable && event.type !== 'mousemove') event.preventDefault();
}

/** Reports trusted pointer moves onto another page element, and clicks (REQ-PICK-002). */
function listenForPointer(pane: HTMLElement, hooks: PaneHooks): void {
  let hovered: Element | undefined;
  const targetOf = (event: MouseEvent) =>
    event.isTrusted ? elementAt(event.clientX, event.clientY) : undefined;
  pane.addEventListener('pointermove', (event) => {
    swallow(event);
    const target = targetOf(event);
    if (!target || target === hovered) return;
    hovered = target;
    hooks.onHover(target);
  });
  pane.addEventListener('click', (event) => {
    swallow(event);
    const target = targetOf(event);
    if (target) hooks.onSelect(target);
  });
  for (const type of SWALLOWED) pane.addEventListener(type, swallow);
}

/** The focusable cover, named and described by the keyboard hint. */
function buildPane(root: HTMLElement, labels: PaneLabels): HTMLElement {
  const pane = createPart(root, 'div', 'pane');
  const hint = createPart(root, 'div', 'hint');
  hint.id = 'sm-picker-hint';
  hint.textContent = labels.hint;
  pane.setAttribute('role', 'application');
  pane.setAttribute('aria-label', labels.paneName);
  pane.setAttribute('aria-describedby', hint.id);
  return pane;
}

function buildLive(root: HTMLElement): HTMLElement {
  const live = createPart(root, 'div', 'live');
  live.setAttribute('role', 'status');
  live.setAttribute('aria-live', 'polite');
  return live;
}

/**
 * Covers the viewport with the picker's own top-layer host (D-240): the page never receives the
 * picker's pointer or keyboard input, and targets are found with `elementsFromPoint`.
 */
export function createGlassPane(hooks: PaneHooks, labels: PaneLabels): GlassPane {
  const host = createPickerHost([GLASS_PANE_CSS, PANEL_CSS]);
  const pane = buildPane(host.root, labels);
  const parts = {
    outline: createPart(host.root, 'div', 'outline'),
    tooltip: createPart(host.root, 'div', 'tooltip'),
    live: buildLive(host.root),
  };
  let highlighted: Element | null = null;
  const draw = () => drawHighlight(parts, highlighted, labels);
  listenForPointer(pane, hooks);
  listenForKeys(pane, hooks.onKey);
  const releaseFocus = captureFocus(pane, host.root);
  // The page may scroll under the pane (wheel, keyboard): keep the outline on its element.
  addEventListener('scroll', draw, { capture: true, passive: true });
  draw();

  let disposed = false;
  return {
    root: host.root,
    highlight(element) {
      highlighted = element;
      draw();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      removeEventListener('scroll', draw, { capture: true });
      host.dispose();
      releaseFocus();
    },
  };
}
