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
};

export type HighlightParts = { readonly outline: HTMLElement; readonly tooltip: HTMLElement };

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

/** The tooltip text: the element's label, plus a note for frames and components (REQ-PICK-008). */
function tooltipText(element: Element, labels: PaneLabels): string {
  const note = candidateNote(element);
  const label = describeElement(element);
  if (note === undefined) return label;
  return `${label} · ${note === 'frame' ? labels.frameNote : labels.componentNote}`;
}

/** Draws the outline and tooltip on `element`, or hides both. Page text goes in as text only. */
export function drawHighlight(
  parts: HighlightParts,
  element: Element | null,
  labels: PaneLabels,
): void {
  const { outline, tooltip } = parts;
  outline.hidden = element === null;
  tooltip.hidden = element === null;
  if (element === null) return;
  const rect = element.getBoundingClientRect();
  placeOutline(outline, rect);
  tooltip.textContent = tooltipText(element, labels);
  placeTooltip(tooltip, rect);
}
