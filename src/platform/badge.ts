import type { Badge, Logger } from '../app/ports';
import { notImplemented } from '../core/not-implemented';

/** The badge colors: JavaScript can't read tokens.css, so the values are copied (and tested). */
export function badgeColors(): { readonly background: string; readonly text: string } {
  return notImplemented();
}

/** The Badge adapter over `browser.action`: a text and colors per tab (REQ-POP-007). */
export function createBadge(_logger: Logger): Badge {
  return notImplemented();
}
