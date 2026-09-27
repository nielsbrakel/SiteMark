import { announcement } from './announce';
import { candidateNote, describeElement } from './candidate';

/** The outline sits 2 px outside the element: its border and outline are 2 px each. */
const OUTLINE_GAP = 2;
const TOOLTIP_GAP = 8;
const TOOLTIP_HEIGHT = 28;
const EDGE = 8;

/** Texts the pane shows, from browser.i18n (the entrypoint passes them in). */
export type PaneLabels = {
  /** Tooltip note on an iframe: the whole frame gets marked (REQ-PICK-008). */
  readonly frameNote: string;
  /** Tooltip note on a web component: its host gets marked (REQ-PICK-008). */
  readonly componentNote: string;
  /** The accessible name of the focused pane. */
  readonly paneName: string;
  /** "Click to select · ↑↓←→ navigate · Enter select · Esc cancel". */
  readonly hint: string;
  /** "120 by 36", for the live region (REQ-A11Y-011). */
  readonly size: (width: number, height: number) => string;
};

export type HighlightParts = {
  readonly outline: HTMLElement;
  readonly tooltip: HTMLElement;
  readonly live: HTMLElement;
};

function px(element: HTMLElement, property: string, value: number): void {
  element.style.setProperty(property, `${Math.round(value)}px`);
}

function placeOutline(outline: HTMLElement, rect: DOMRect): void {
  px(outline, 'left', rect.left - OUTLINE_GAP);
  px(outline, 'top', rect.top - OUTLINE_GAP);
  px(outline, 'width', rect.width + 2 * OUTLINE_GAP);
  px(outline, 'height', rect.height + 2 * OUTLINE_GAP);
}

/** Below the element, or above it when there is no room; always inside the viewport. */
function placeTooltip(tooltip: HTMLElement, rect: DOMRect): void {
  const below = rect.bottom + TOOLTIP_GAP;
  const top =
    below + TOOLTIP_HEIGHT <= innerHeight ? below : rect.top - TOOLTIP_GAP - TOOLTIP_HEIGHT;
  const maxLeft = innerWidth - tooltip.offsetWidth - EDGE;
  px(tooltip, 'top', Math.max(EDGE, top));
  px(tooltip, 'left', Math.max(EDGE, Math.min(rect.left, maxLeft)));
}

/** The frame/component note (REQ-PICK-008), or `undefined`. */
function noteText(element: Element, labels: PaneLabels): string | undefined {
  const note = candidateNote(element);
  if (note === undefined) return undefined;
  return note === 'frame' ? labels.frameNote : labels.componentNote;
}

/**
 * Draws the outline and tooltip on `element`, or hides both, and puts the candidate in the live
 * region. Page text (ids, classes, labels) goes in as text only.
 */
export function drawHighlight(
  parts: HighlightParts,
  element: Element | null,
  labels: PaneLabels,
): void {
  const { outline, tooltip, live } = parts;
  outline.hidden = element === null;
  tooltip.hidden = element === null;
  if (element === null) {
    live.textContent = '';
    return;
  }
  const rect = element.getBoundingClientRect();
  const note = noteText(element, labels);
  placeOutline(outline, rect);
  tooltip.textContent = [describeElement(element), note].filter(Boolean).join(' · ');
  placeTooltip(tooltip, rect);
  const size = labels.size(Math.round(rect.width), Math.round(rect.height));
  const text = announcement(element, size, note);
  // Scrolling redraws too: only a new candidate is announced again.
  if (live.textContent !== text) live.textContent = text;
}
