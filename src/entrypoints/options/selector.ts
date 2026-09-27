const SELECTOR_MAX = 500;

/**
 * Is `selector` a CSS selector the marker can use (REQ-OPT-003): 1–500 characters that the
 * browser's own parser accepts? Checked against an empty fragment, so nothing is queried.
 */
export function isValidSelector(selector: string): boolean {
  if (selector.trim().length === 0 || selector.length > SELECTOR_MAX) return false;
  try {
    document.createDocumentFragment().querySelector(selector);
    return true;
  } catch {
    return false;
  }
}
