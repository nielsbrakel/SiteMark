import { BANNER_CSS } from './banner.css';
import { BASE_CSS } from './base.css';
import { FRAME_CSS } from './frame.css';
import { TINT_CSS } from './tint.css';

/**
 * The static styles of every view, for the host to adopt once (D-232). The text is constant:
 * it is never built from user data (REQ-RND-011).
 */
export function markerViewCss(): string {
  return [BASE_CSS, FRAME_CSS, TINT_CSS, BANNER_CSS].join('');
}
