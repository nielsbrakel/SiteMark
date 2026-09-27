// Where the mini panel sits (docs/design.md §5.3, REQ-A11Y-010): in the corner opposite the
// selection, so it never covers what was picked, and "Move panel" cycles the corners clockwise
// (the non-drag alternative).

export type PanelCorner = 'top-left' | 'top-right' | 'bottom-right' | 'bottom-left';

export type Box = {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
};

const CLOCKWISE: readonly PanelCorner[] = ['top-left', 'top-right', 'bottom-right', 'bottom-left'];

/** The corner diagonally opposite the selection's center. */
export function oppositeCorner(
  selection: Box,
  viewport: { readonly width: number; readonly height: number },
): PanelCorner {
  const isUpper = selection.top + selection.height / 2 < viewport.height / 2;
  const isLeft = selection.left + selection.width / 2 < viewport.width / 2;
  const vertical = isUpper ? 'bottom' : 'top';
  const horizontal = isLeft ? 'right' : 'left';
  return `${vertical}-${horizontal}` as const;
}

/** The next corner, clockwise. */
export function nextCorner(corner: PanelCorner): PanelCorner {
  return CLOCKWISE[(CLOCKWISE.indexOf(corner) + 1) % CLOCKWISE.length] ?? corner;
}
