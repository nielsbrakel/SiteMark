/**
 * Stripes: a diagonal hazard pattern in the mark color (design §6). On the page, `edge` is a
 * 6 px strip along the top and `full` the whole viewport (REQ-MARK-007).
 */
export const STRIPES_CSS = `
.sm-stripes {
  background-image: repeating-linear-gradient(-45deg, var(--sm-mark-color) 0 12px, transparent 12px 24px);
}
.sm-stripes[data-area] {
  top: 0;
  right: 0;
  left: 0;
}
.sm-stripes[data-area='edge'] {
  height: 6px;
}
.sm-stripes[data-area='full'] {
  bottom: 0;
}
`;
