import { PICKER_TAG } from './picker-host';

// What the picker can point at (REQ-PICK-002, REQ-PICK-008). `document.elementsFromPoint` already
// retargets shadow content to its host and stops at an iframe, so a pick inside a component marks
// the component and a pick inside a frame marks the frame element.

/** SiteMark's own hosts: the picker's glass pane and the marker's root. */
const OWN_HOSTS = new Set([PICKER_TAG, 'sitemark-root']);

/** The topmost page element at a viewport point, skipping SiteMark's hosts and `<html>`. */
export function elementAt(x: number, y: number): Element | undefined {
  return document
    .elementsFromPoint(x, y)
    .find((element) => !OWN_HOSTS.has(element.localName) && element !== document.documentElement);
}

/** Why a pick marks more than the pointer is over: a whole frame, or a component. */
export type CandidateNote = 'frame' | 'component';

export function candidateNote(element: Element): CandidateNote | undefined {
  if (element.localName === 'iframe' || element.localName === 'frame') return 'frame';
  if (element.localName.includes('-') || element.shadowRoot) return 'component';
  return undefined;
}

/** The tooltip's label: `button#delete.btn-danger · 120×36` (at most two classes). */
export function describeElement(element: Element): string {
  const { width, height } = element.getBoundingClientRect();
  const id = element.id ? `#${element.id}` : '';
  const classes = [...element.classList]
    .slice(0, 2)
    .map((name) => `.${name}`)
    .join('');
  return `${element.localName}${id}${classes} · ${Math.round(width)}×${Math.round(height)}`;
}
