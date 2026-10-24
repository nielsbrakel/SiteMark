// Slide 5 of the store images (store-slides.ts): the mark editor's colour row and effect switches,
// stacked on one sheet so every switch is named and readable, beside the live preview.
import { CHROME, FRAME, frame, header, place, type Shot, type Shots, VIEW } from './store-art';
import type { Copy } from './store-copy';
import { around, type Composed, choices, WIDE } from './store-slide-parts';

const SHEET = 'border:2px solid var(--line);border-radius:3px;box-shadow:0 3px 0 var(--edge)';

/** The rows one under the other at `scale`, from (left, top) of the view at (x, y) on the slide. */
function stack(
  rows: Shot[],
  [x, y]: [number, number],
  [left, top]: [number, number],
  scale: number,
) {
  let at = top;
  return rows.map((row) => {
    const placed = place(row, x + left, y + at, scale);
    const img = place(row, 0, 0, scale).img(left, at);
    at += row.height * scale;
    return { placed, img };
  });
}

/** Where the sheet and the preview go in a view of `width` × `height`, and their scales. */
function layout(rows: Shot[], preview: Shot, width: number, height: number) {
  const sheetWidth = Math.max(...rows.map((row) => row.width));
  const sheetHeight = rows.reduce((sum, row) => sum + row.height, 0);
  const scale = Math.min(1.4, (height - 40) / sheetHeight, (width * 0.64) / sheetWidth);
  const [fx, fy] = [24, (height - sheetHeight * scale) / 2];
  const px = fx + sheetWidth * scale + 40;
  const previewScale = (width - 24 - px) / preview.width;
  const py = height - 30 - preview.height * previewScale;
  const outline = `<div style="position:absolute;left:${fx - 2}px;top:${fy - 2}px;width:${sheetWidth * scale + 4}px;height:${sheetHeight * scale + 4}px;${SHEET}"></div>`;
  return { scale, fx, fy, px, py, previewScale, outline };
}

/**
 * Slide 5: the editor's colour row and effect switches stacked on one sheet, as large as the
 * frame allows, and the live preview beside it.
 */
export function options(c: Copy['options'], { rows, preview }: Shots['options']): Composed {
  const [x, y, width, height] = [FRAME.margin + CHROME.x, VIEW.top, WIDE, VIEW.height];
  const { scale, fx, fy, px, py, previewScale, outline } = layout(rows, preview, width, height);
  const stacked = stack(rows, [x, y], [fx, fy], scale);
  const swatches = (stacked[0] as (typeof stacked)[number]).placed.at('swatches');
  const figure = place(preview, x + px, y + py, previewScale).at('figure');
  const body = `<div style="position:absolute;inset:0;background:var(--board)"></div>${outline}${stacked.map((row) => row.img).join('')}${place(preview, 0, 0, previewScale).img(px, py, SHEET)}`;
  const presetsAt: [number, number] = [
    swatches.x + swatches.width + 70,
    swatches.y + swatches.height / 2,
  ];
  const previewAt: [number, number] = [figure.x + figure.width / 2, figure.y - 70];
  return {
    body: `${header(c.head, c.sub)}${frame(x, y, width, height, rows[0] as Shot, body)}`,
    notes: [
      choices(
        swatches,
        c.presets,
        around(presetsAt, [
          [0, 0],
          [0, 30],
        ]),
        'left',
        1.5,
      ),
      choices(
        figure,
        c.preview,
        around(previewAt, [
          [0, 0],
          [0, 20],
        ]),
        'down',
      ),
    ],
    targets: [swatches, figure, ...stacked.slice(1).map((row) => row.placed.at('switch'))],
    avoid: [],
  };
}
