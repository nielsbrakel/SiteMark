/**
 * Banner: a full-width bar on one edge, 24 px compact or 36 px regular, whose chevron (the only
 * part of a mark that takes input) collapses it to a 24 × 24 tab (REQ-MARK-005, REQ-RND-002).
 */
export const BANNER_CSS = `
.sm-banner {
  left: 0;
  right: 0;
  height: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 0 0 8px;
  background: var(--sm-mark-color);
  color: var(--sm-mark-text);
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}
.sm-banner[data-edge='top'] {
  top: 0;
}
.sm-banner[data-edge='bottom'] {
  bottom: 0;
}
.sm-banner[data-size='regular'] {
  height: 36px;
  font-size: 14px;
}
.sm-banner__glyph {
  flex: none;
  width: 8px;
  height: 11px;
  background: currentcolor;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 72%, 0 100%);
}
.sm-banner__text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  text-align: center;
}
.sm-banner__chevron {
  flex: none;
  align-self: stretch;
  width: 32px;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: auto;
}
.sm-banner__chevron::before {
  content: '';
  width: 7px;
  height: 7px;
  border: solid currentcolor;
  border-width: 2px 2px 0 0;
  transform: translateY(2px) rotate(-45deg);
}
.sm-banner__chevron:focus-visible {
  outline: 2px solid var(--sm-mark-text);
  outline-offset: -3px;
}
.sm-banner[data-edge='bottom'] .sm-banner__chevron::before,
.sm-banner[data-edge='top'][data-collapsed] .sm-banner__chevron::before {
  transform: translateY(-2px) rotate(135deg);
}
.sm-banner[data-edge='bottom'][data-collapsed] .sm-banner__chevron::before {
  transform: translateY(2px) rotate(-45deg);
}
.sm-banner[data-collapsed] {
  left: auto;
  width: 24px;
  height: 24px;
  padding: 0;
}
.sm-banner[data-collapsed] .sm-banner__glyph,
.sm-banner[data-collapsed] .sm-banner__text {
  display: none;
}
.sm-banner[data-collapsed] .sm-banner__chevron {
  width: 24px;
}
`;
