/**
 * Watermark: rows of the text on a square plane rotated −30° around the viewport's center,
 * 20 px bold in the mark color; the view sets the plane's size and the opacity (REQ-MARK-008).
 */
export const WATERMARK_CSS = `
.sm-watermark {
  overflow: hidden;
}
.sm-watermark__plane {
  position: absolute;
  top: 50%;
  left: 50%;
  overflow: hidden;
  transform: translate(-50%, -50%) rotate(-30deg);
  color: var(--sm-mark-color);
  font-size: 20px;
  font-weight: 700;
}
.sm-watermark__row {
  line-height: 96px;
  white-space: pre;
}
.sm-watermark__row:nth-child(even) {
  text-indent: -3em;
}
`;
