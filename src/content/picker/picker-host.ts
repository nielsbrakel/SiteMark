import TOKENS_CSS from '../../styles/tokens.css?raw';
import { adoptStyles } from '../marker/adopt-styles';
import { setPopover } from '../marker/host-element';

/** The picker's own element, next to the marker's `<sitemark-root>` (never looked up in the DOM). */
export const PICKER_TAG = 'sitemark-picker';

/**
 * Unlike the marker's host, the picker's host takes every pointer event (D-240): it is the glass
 * pane. Every `:host` declaration is `!important`, so page styles can't hide or move it.
 */
const PICKER_HOST_CSS = `
:host {
  all: initial !important;
  display: block !important;
  position: fixed !important;
  inset: 0 !important;
  pointer-events: auto !important;
  z-index: 2147483647 !important;
}
:host::backdrop {
  display: none !important;
}
[hidden] {
  display: none !important;
}
`;

/** tokens.css inside the shadow root: its `:root` rules apply to the `.sm-theme` wrapper instead. */
const SCOPED_TOKENS_CSS = TOKENS_CSS.replaceAll(':root', '.sm-theme');

export type PickerHost = {
  readonly element: HTMLElement;
  /** The themed container inside the shadow root (`data-theme` follows the settings). */
  readonly root: HTMLElement;
  dispose(): void;
};

/**
 * Adds `<sitemark-picker popover="manual">` to `<html>` and promotes it to the top layer. The shadow
 * root is `closed` in production and `open` in test and e2e builds (D-226).
 */
export function createPickerHost(cssTexts: readonly string[]): PickerHost {
  const element = document.createElement(PICKER_TAG);
  element.setAttribute('popover', 'manual');
  const shadow = element.attachShadow({ mode: __SHADOW_MODE__ });
  adoptStyles(shadow, [PICKER_HOST_CSS, SCOPED_TOKENS_CSS, ...cssTexts]);
  const root = document.createElement('div');
  root.className = 'sm-theme';
  shadow.append(root);
  document.documentElement.append(element);
  setPopover(element, true);
  return { element, root, dispose: () => element.remove() };
}

/** A part of the picker UI, found by tests through `data-part`. */
export function createPart<K extends keyof HTMLElementTagNameMap>(
  parent: HTMLElement,
  tag: K,
  name: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  element.className = `sm-${name}`;
  element.dataset.part = name;
  parent.append(element);
  return element;
}
