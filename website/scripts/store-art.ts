// The parts of the store images (docs/design.md): browser frames on the kraft board, a marker
// highlight under the key word, and paper notes whose curved ink arrows end 10 px outside a real
// element's box. Colors are tokens.css values and the mark presets.
import { readFileSync } from 'node:fs';
import path from 'node:path';

export type Box = { x: number; y: number; width: number; height: number };
export type Size = { width: number; height: number };

/** A capture of a `width` × `height` CSS px area at 2×, with its targets' boxes in that area. */
export type Shot = {
  src: string;
  width: number;
  height: number;
  title: string;
  host: string;
  boxes: Record<string, Box>;
  /** The boxes of the page's own text, which no note may cover. */
  texts: Box[];
};

export type Shots = {
  production: Shot;
  environments: Shot[];
  popup: { page: Shot; panel: Shot };
  picker: Shot;
  options: { rows: Shot[]; preview: Shot };
  privacy: { page: Shot; panel: Shot };
};

/** The mark presets (D-205). */
export const MARK = { red: '#c93a2e', amber: '#f4a300', blue: '#1f6feb' } as const;

export const LIGHT =
  '--ink:#33261b;--board:#c9a77c;--surface:#fbf6e8;--surface-2:#fffdf4;--soft:#efe4cb;--panel:#fffefa;--edge:#d9ccb0;--shade:rgb(60 35 15/28%);--line:#33261b;--hl:#f5cf5a;--note:#fffefa;--ok:#17692e';
export const DARK =
  '--ink:#f7f0e3;--board:#17121f;--surface:#241d33;--surface-2:#2f2742;--soft:#3a3150;--panel:#342b4d;--edge:#3d3454;--shade:rgb(0 0 0/60%);--line:#9a8fb8;--hl:rgb(245 207 90/38%);--note:#342b4d;--ok:#7be09a';

const repository = path.resolve(import.meta.dirname, '../..');
const base64 = (file: string) => readFileSync(path.join(repository, file)).toString('base64');
const font = (family: string, file: string) =>
  `@font-face{font-family:'${family}';src:url(data:font/woff2;base64,${base64(`src/assets/fonts/${file}`)})}`;
const ICON = `data:image/png;base64,${base64('public/icon/32.png')}`;

export const CSS = `${font('Caveat Brush', 'caveat-brush-latin.woff2')}${font('Patrick Hand', 'patrick-hand-latin.woff2')}
html,body{margin:0}*{box-sizing:border-box}
body{width:1280px;height:800px;background:var(--board);font:34px 'Patrick Hand',sans-serif;color:var(--ink);position:relative;overflow:hidden}
h1{margin:0;position:absolute;top:26px;left:0;right:0;text-align:center;white-space:nowrap;font:400 72px/1.05 'Caveat Brush',sans-serif}
h1 em{font-style:normal;padding:0 6px;background:linear-gradient(transparent 62%,var(--hl) 62% 92%,transparent 92%)}
.sub{margin:0;position:absolute;top:102px;left:0;right:0;text-align:center}
.frame{position:absolute;border:3px solid var(--line);border-radius:8px;background:var(--surface);box-shadow:0 3px 0 var(--edge),0 10px 16px -6px var(--shade);font:16px system-ui,sans-serif}
.tabs{height:36px;padding:6px 10px 0;background:var(--soft);border-radius:5px 5px 0 0;display:flex}
.tab{max-width:300px;padding:6px 14px;border-radius:6px 6px 0 0;background:var(--surface);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bar{height:40px;padding:6px 10px;display:flex;gap:10px;align-items:center;border-bottom:2px solid var(--line)}
.url{flex:1;padding:3px 14px;border-radius:14px;background:var(--surface-2);white-space:nowrap;overflow:hidden}
.bar img{width:28px}.view{position:relative;overflow:hidden;border-radius:0 0 5px 5px}
img.shot{position:absolute;display:block}
.tape{position:absolute;width:96px;height:26px;opacity:.92;z-index:3;box-shadow:0 1px 2px var(--shade);background:repeating-linear-gradient(45deg,rgb(255 255 255/40%) 0 5px,transparent 5px 10px),#f5cf5a}
.note{position:absolute;z-index:5;width:max-content;max-width:460px;padding:8px 16px;border:3px solid var(--line);border-radius:3px;background:var(--note);color:var(--ink);box-shadow:1px 3px 0 var(--line);font:400 32px/1.1 'Caveat Brush',sans-serif;white-space:pre-line}
svg.ink{position:absolute;left:0;top:0;z-index:6;overflow:visible}
.host{position:absolute;font-size:28px;display:flex;gap:10px;align-items:center}.dot{width:16px;height:16px;border-radius:50%;border:1px solid var(--ink)}
.checks{position:absolute;margin:0;padding:0;list-style:none;font-size:34px;line-height:1.25}.checks li{margin-bottom:34px;padding-left:52px;position:relative}
.checks li::before{content:'✓';position:absolute;left:0;color:var(--ok);font:400 44px/1 'Caveat Brush',sans-serif}`;

export type Head = [string, string, string];

export const html = (text: string) => text.replace(/[&<>]/g, (c) => `&#${c.charCodeAt(0)};`);
export const header = ([a, em, b]: Head, sub: string) =>
  `<h1>${html(a)}<em>${html(em)}</em>${html(b)}</h1><p class="sub">${html(sub)}</p>`;
const tape = (x: number, y: number) =>
  `<div class="tape" style="left:${x}px;top:${y}px;transform:rotate(-3deg)"></div>`;

/** The frame's tab strip and address bar, with its 3 px outline: the view starts this far in. */
export const CHROME = { x: 3, y: 3 + 36 + 40 };

/** Every frame sits between these outer edges, at least `margin` from the slide's sides. */
export const FRAME = { top: 184, bottom: 764, margin: 60 } as const;

/** The view (page area) of a frame that spans FRAME.top to FRAME.bottom. */
export const VIEW = {
  top: FRAME.top + CHROME.y,
  height: FRAME.bottom - CHROME.x - FRAME.top - CHROME.y,
};

/**
 * The CSS viewport of each page capture. Smaller than a desktop window, so a slide shows it at
 * about 1.2× and the page's 18 px text reaches the slide at about 22 px (the 2× capture keeps it
 * sharp). Slide 2's three windows are narrow, so their marks fill them.
 */
export const PAGE_VIEWS = {
  production: { width: 946, height: 408 },
  environment: { width: 380, height: 460 },
  popup: { width: 900, height: 404 },
  privacy: { width: 620, height: 408 },
  picker: { width: 720, height: 600 },
} as const satisfies Record<string, Size>;

/** A browser window whose view of `width` × `height` px starts at (x, y) on the slide. */
export function frame(
  x: number,
  y: number,
  width: number,
  height: number,
  shot: Shot,
  body: string,
  icon = false,
) {
  return `${tape(x - CHROME.x + width / 2 + 3 - 48, y - 14 - CHROME.y)}<div class="frame" style="left:${x - CHROME.x}px;top:${y - CHROME.y}px;width:${width + 6}px">
    <div class="tabs"><span class="tab">${html(shot.title)}</span></div>
    <div class="bar"><span class="url">${html(shot.host)}</span>${icon ? `<img src="${ICON}" alt="">` : ''}</div>
    <div class="view" style="height:${height}px">${body}</div></div>`;
}

/** A shot drawn at `scale` with its top-left at (x, y) of the slide; `at` maps its boxes onto the slide. */
export function place(shot: Shot, x: number, y: number, scale: number) {
  const at = (name: string): Box => {
    const box = shot.boxes[name];
    if (!box) throw new Error(`The capture has no box named ${name}`);
    return {
      x: x + box.x * scale,
      y: y + box.y * scale,
      width: box.width * scale,
      height: box.height * scale,
    };
  };
  const texts = () =>
    shot.texts.map((box) => ({
      x: x + box.x * scale,
      y: y + box.y * scale,
      width: box.width * scale,
      height: box.height * scale,
    }));
  const img = (left: number, top: number, style = '') =>
    `<img class="shot" src="${shot.src}" style="left:${left}px;top:${top}px;width:${shot.width * scale}px;${style}">`;
  return { at, img, texts };
}

type Side = 'up' | 'down' | 'left' | 'right';
const PLACE: Record<Side, string> = {
  up: 'translate(-50%,8px)',
  down: 'translate(-50%,calc(-100% - 8px))',
  left: 'translate(8px,-50%)',
  right: 'translate(calc(-100% - 8px),-50%)',
};
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/** Where an arrow from (x, y) heading `side` ends: 10 px outside the facing edge of `box`. */
export function arrowEnd(box: Box, x: number, y: number, side: Side): [number, number] {
  const cx = clamp(x, box.x + 6, box.x + box.width - 6);
  const cy = clamp(y, box.y + 6, box.y + box.height - 6);
  switch (side) {
    case 'up':
      return [cx, box.y + box.height + 10];
    case 'down':
      return [cx, box.y - 10];
    case 'left':
      return [box.x + box.width + 10, cy];
    case 'right':
      return [box.x - 10, cy];
  }
}

/** A paper note whose edge sits at (x, y), with a curved ink arrow from there heading `side` to `box`. */
export function callout(
  box: Box,
  label: string,
  [x, y]: [number, number],
  side: Side,
  tilt = -1.5,
) {
  const [ex, ey] = arrowEnd(box, x, y, side);
  const [mx, my] = [(x + ex) / 2, (y + ey) / 2];
  const [cx, cy] = [mx + (ey - y) * 0.25, my - (ex - x) * 0.25];
  const length = Math.hypot(ex - cx, ey - cy);
  const [dx, dy] = [(ex - cx) / length, (ey - cy) / length];
  const wing = (turn: number) =>
    `${ex - 16 * (dx * Math.cos(turn) - dy * Math.sin(turn))} ${ey - 16 * (dx * Math.sin(turn) + dy * Math.cos(turn))}`;
  return `<div class="note" style="left:${x}px;top:${y}px;transform:${PLACE[side]} rotate(${tilt}deg)">${html(label)}</div>
    <svg class="ink" width="1280" height="800"><path d="M${x} ${y}Q${cx} ${cy} ${ex} ${ey}M${wing(0.5)}L${ex} ${ey}L${wing(-0.5)}" fill="none" stroke="var(--ink)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
