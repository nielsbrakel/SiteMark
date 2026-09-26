// Loading and drawing the favicon for the tint (REQ-MARK-010, design §6).

const SIZE = 32;
/** The dot: 12 px across (radius 6) with a 2 px white ring, in the bottom-right corner. */
const DOT_RADIUS = 6;
const RING_RADIUS = DOT_RADIUS + 2;
const DOT_CENTER = SIZE - RING_RADIUS;
/** The ring stays white in every theme: it separates the dot from any favicon. */
const RING_COLOR = '#ffffff';
const HEX = /^#[0-9a-f]{6}$/i;

/** Only validated hex colors reach the canvas. */
export function isHexColor(color: string): boolean {
  return HEX.test(color);
}

/**
 * Loads the site's own favicon (the D-217 exception to "no network", documented in PRIVACY.md).
 * `crossOrigin = 'anonymous'`: a same-origin icon loads as usual, a cross-origin one carries no
 * cookies and only becomes readable when its server allows CORS; otherwise it fails and the tint
 * is unavailable. Resolves `undefined` on an error or after `timeoutMs`; never rejects.
 */
export function loadImage(src: string, timeoutMs: number): Promise<HTMLImageElement | undefined> {
  return new Promise((resolve) => {
    const image = new Image();
    const settle = (loaded: HTMLImageElement | undefined) => {
      clearTimeout(timer);
      image.onload = null;
      image.onerror = null;
      resolve(loaded);
    };
    const timer = setTimeout(() => settle(undefined), timeoutMs);
    image.onload = () => settle(image);
    image.onerror = () => settle(undefined);
    image.crossOrigin = 'anonymous';
    image.src = src;
  });
}

function fillCircle(context: CanvasRenderingContext2D, radius: number, color: string): void {
  context.beginPath();
  context.arc(DOT_CENTER, DOT_CENTER, radius, 0, 2 * Math.PI);
  context.fillStyle = color;
  context.fill();
}

/**
 * The favicon at 32 px with the dot in `color`, as a PNG data URL. `undefined` when `color`
 * isn't a hex color or the image can't be read (a tainted canvas throws a SecurityError).
 */
export function drawTinted(image: HTMLImageElement, color: string): string | undefined {
  if (!isHexColor(color)) return undefined;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const context = canvas.getContext('2d');
    if (!context) return undefined;
    context.drawImage(image, 0, 0, SIZE, SIZE);
    fillCircle(context, RING_RADIUS, RING_COLOR);
    fillCircle(context, DOT_RADIUS, color);
    return canvas.toDataURL('image/png');
  } catch {
    return undefined;
  }
}
