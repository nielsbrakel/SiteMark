/**
 * Every view: absolutely positioned in the container, never taking input (REQ-RND-002) and
 * immune to forced colors (REQ-A11Y-007). System fonts only, no network (REQ-PRIV-005).
 * `.sm-fill` covers the container (the viewport); `.sm-box` is placed on a target element's box.
 */
export const BASE_CSS = `
.sm-view {
  position: absolute;
  box-sizing: border-box;
  margin: 0;
  pointer-events: none;
  forced-color-adjust: none;
  font-family: ui-rounded, 'SF Pro Rounded', system-ui, -apple-system, 'Segoe UI', roboto, sans-serif;
}
.sm-view *,
.sm-view *::before {
  box-sizing: border-box;
}
.sm-view[hidden] {
  display: none !important;
}
.sm-fill {
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}
.sm-box {
  top: 0;
  left: 0;
}
`;
