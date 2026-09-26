/**
 * The host's own sheet. Every `:host` declaration is `!important`: in the cascade, important rules
 * from inside a shadow tree beat the page's important rules, so no page style can hide, move or
 * make the host clickable (REQ-SEC-006). `all: initial` also stops inherited page fonts and colors.
 * The host stays displayed while its popover is closed: z-index is the fallback (REQ-RND-006).
 */
export const HOST_CSS = `
:host {
  all: initial !important;
  display: block !important;
  position: fixed !important;
  inset: 0 !important;
  pointer-events: none !important;
  z-index: 2147483647 !important;
}
:host::backdrop {
  display: none !important;
}
`;
