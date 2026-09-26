import { notImplemented } from '../../core/not-implemented';

/** Texts the pane shows, from browser.i18n (the entrypoint passes them in). */
export type PaneLabels = {
  /** Tooltip note on an iframe: the whole frame gets marked (REQ-PICK-008). */
  readonly frameNote: string;
  /** Tooltip note on a web component: its host gets marked (REQ-PICK-008). */
  readonly componentNote: string;
};

/** What the pane reports; only trusted input reaches these (REQ-SEC-005). */
export type PaneHooks = {
  /** The pointer moved onto another page element. */
  readonly onHover: (element: Element) => void;
  /** A click on a page element. */
  readonly onSelect: (element: Element) => void;
};

export type GlassPane = {
  /** Outlines the element and shows its tooltip; `null` hides both. */
  highlight(element: Element | null): void;
  /** Removes the pane and its listeners. Idempotent. */
  dispose(): void;
};

/**
 * Covers the viewport with the picker's own top-layer host (D-240): the page never receives the
 * picker's pointer input, and targets are found with `elementsFromPoint`.
 */
export function createGlassPane(_hooks: PaneHooks, _labels: PaneLabels): GlassPane {
  return notImplemented();
}
