// Shared pieces of the store slides (store-slides.ts): the widest frame, and the places a note may go.
import { type Box, CHROME, callout, FRAME } from './store-art';

/** The widest view a frame can have between the slide's side margins. */
export const WIDE = 1280 - 2 * FRAME.margin - 2 * CHROME.x;

type Side = Parameters<typeof callout>[3];
export type Composed = { body: string; notes: string[][]; targets: Box[]; avoid: Box[] };

/** A note for `box` at each of `anchors`, heading `side`: the slide takes the first that fits. */
export const choices = (
  box: Box,
  label: string,
  anchors: [number, number][],
  side: Side,
  tilt?: number,
): string[] => anchors.map((anchor) => callout(box, label, anchor, side, tilt));

/** Anchors from (x, y), moved by each of `steps` (dx, dy). */
export const around = ([x, y]: [number, number], steps: [number, number][]): [number, number][] =>
  steps.map(([dx, dy]) => [x + dx, y + dy]);
