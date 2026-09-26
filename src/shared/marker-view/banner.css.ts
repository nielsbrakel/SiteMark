/** Banner: a full-width bar on one edge, 24 px compact or 36 px regular (REQ-MARK-005). */
export const BANNER_CSS = `
.sm-banner {
  left: 0;
  right: 0;
  height: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 8px;
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
`;
