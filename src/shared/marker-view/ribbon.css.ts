/**
 * Ribbon (design §6): a band B px high and 5.625 B long (180 × 32 on the page), rotated 45°
 * with its center 1.40625 B (45 px) in from both edges of the corner, clipped by a 4 B square
 * corner box. Element views set --sm-ribbon-band; the page uses 32 px. The text fits within
 * 3.5 B, the part of the band that stays visible (REQ-MARK-002).
 */
export const RIBBON_CSS = `
.sm-ribbon {
  --sm-ribbon-b: var(--sm-ribbon-band, 32px);
  --sm-ribbon-shift: calc(var(--sm-ribbon-b) * 0.59375);
  position: absolute;
  width: calc(var(--sm-ribbon-b) * 4);
  height: calc(var(--sm-ribbon-b) * 4);
  overflow: hidden;
}
.sm-ribbon[data-corner='top-left'] {
  top: 0;
  left: 0;
  --sm-ribbon-x: -1;
  --sm-ribbon-y: -1;
  --sm-ribbon-angle: -45deg;
}
.sm-ribbon[data-corner='top-right'] {
  top: 0;
  right: 0;
  --sm-ribbon-x: 1;
  --sm-ribbon-y: -1;
  --sm-ribbon-angle: 45deg;
}
.sm-ribbon[data-corner='bottom-left'] {
  bottom: 0;
  left: 0;
  --sm-ribbon-x: -1;
  --sm-ribbon-y: 1;
  --sm-ribbon-angle: 45deg;
}
.sm-ribbon[data-corner='bottom-right'] {
  right: 0;
  bottom: 0;
  --sm-ribbon-x: 1;
  --sm-ribbon-y: 1;
  --sm-ribbon-angle: -45deg;
}
.sm-ribbon__band {
  position: absolute;
  top: 50%;
  left: 50%;
  width: calc(var(--sm-ribbon-b) * 5.625);
  height: var(--sm-ribbon-b);
  margin: calc(var(--sm-ribbon-b) * -0.5) 0 0 calc(var(--sm-ribbon-b) * -2.8125);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--sm-mark-color);
  color: var(--sm-mark-text);
  transform: translate(
      calc(var(--sm-ribbon-shift) * var(--sm-ribbon-x)),
      calc(var(--sm-ribbon-shift) * var(--sm-ribbon-y))
    )
    rotate(var(--sm-ribbon-angle));
}
.sm-ribbon__text {
  max-width: calc(var(--sm-ribbon-b) * 3.5);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.sm-ribbon-box {
  overflow: hidden;
}
.sm-ribbon__dot {
  position: absolute;
  display: none;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--sm-mark-color);
}
.sm-ribbon__dot[data-corner^='top'] {
  top: 2px;
}
.sm-ribbon__dot[data-corner^='bottom'] {
  bottom: 2px;
}
.sm-ribbon__dot[data-corner$='left'] {
  left: 2px;
}
.sm-ribbon__dot[data-corner$='right'] {
  right: 2px;
}
.sm-ribbon-box[data-small] .sm-ribbon {
  display: none;
}
.sm-ribbon-box[data-small] .sm-ribbon__dot {
  display: block;
}
`;
