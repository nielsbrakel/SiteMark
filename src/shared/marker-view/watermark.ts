import type { EffectView, PageItemOf, ViewContext } from './effect-view';
import { assembleView, createNode, createRoot, setOpacity, setPx } from './view-dom';

type WatermarkItem = PageItemOf<'watermark'>;

// The text is laid out on a square plane, rotated −30° around the viewport's center. A square
// as wide as the viewport's diagonal covers it at any angle; the plane is sized for at least a
// 4K viewport, so resizing the window rarely uncovers a corner.
const FLOOR = { width: 3840, height: 2160 };
/** The rows' line height in watermark.css.ts. */
const ROW_PX = 96;
/** Lower bound of one 20 px bold character, so every row crosses the plane. */
const MIN_CHAR_PX = 4;
/** Four em spaces between repeats: 80 px at 20 px. */
const GAP = ' '.repeat(4);
const GAP_PX = 80;

function layout(text: string, container: HTMLElement) {
  const width = Math.max(container.clientWidth, FLOOR.width);
  const height = Math.max(container.clientHeight, FLOOR.height);
  const size = Math.ceil(Math.hypot(width, height));
  const repeats = Math.ceil(size / (text.length * MIN_CHAR_PX + GAP_PX)) + 2;
  return { size, rows: Math.ceil(size / ROW_PX), line: Array(repeats).fill(text).join(GAP) };
}

/** The text repeated across the viewport, rotated −30°, at 4–12 % (REQ-MARK-008). */
export function createWatermarkView(
  item: WatermarkItem,
  ctx: ViewContext,
): EffectView<WatermarkItem> {
  const root = createRoot(ctx, 'sm-fill sm-watermark');
  const plane = createNode(ctx, 'div', 'sm-watermark__plane');
  root.append(plane);
  return assembleView(item, ctx, root, {
    render: ({ params }) => {
      setOpacity(root, params.opacityPct, 4, 12);
      const { size, rows, line } = layout(params.text, ctx.container);
      setPx(plane, 'width', size, 0, size);
      setPx(plane, 'height', size, 0, size);
      while (plane.children.length > rows) plane.lastElementChild?.remove();
      while (plane.children.length < rows)
        plane.append(createNode(ctx, 'div', 'sm-watermark__row'));
      for (const row of plane.children) row.textContent = line;
    },
  });
}
