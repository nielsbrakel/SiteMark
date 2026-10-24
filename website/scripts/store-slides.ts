// The store images (store/listing.md): real captures composed into 1280 × 800 slides. The captures
// come in as 2× PNGs with the boxes Playwright measured; the slides come out as HTML for
// store-shots.ts to screenshot. Each note comes with a few places it may go: store-shots.ts takes
// the first one that covers no target, no page text and no other note.
import type { ScreenshotTheme } from '../src/content/screenshots';
import type { Locale } from '../src/i18n/locales';
import {
  type Box,
  CHROME,
  CSS,
  DARK,
  FRAME,
  frame,
  header,
  html,
  LIGHT,
  MARK,
  place,
  type Shot,
  type Shots,
  VIEW,
} from './store-art';
import { COPY, type Copy } from './store-copy';
import { options } from './store-options-slide';
import { around, type Composed, choices, WIDE } from './store-slide-parts';

/** Slide 1: the production page, fully marked, as large as the frame allows. */
function production(c: Copy['production'], shot: Shot): Composed {
  const scale = Math.min(VIEW.height / shot.height, WIDE / shot.width);
  const [x, y] = [(1280 - shot.width * scale) / 2, VIEW.top];
  const { at, texts } = place(shot, x, y, scale);
  const [ribbon, button] = [at('ribbon'), at('delete')];
  const ribbonAt: [number, number] = [ribbon.x - 70, ribbon.y + ribbon.height / 2];
  const buttonAt: [number, number] = [button.x + button.width + 40, button.y + button.height / 2];
  return {
    body: `${header(c.head, c.sub)}${frame(x, y, shot.width * scale, shot.height * scale, shot, place(shot, 0, 0, scale).img(0, 0))}`,
    notes: [
      choices(
        ribbon,
        c.ribbon,
        around(ribbonAt, [
          [0, 0],
          [0, 50],
          [-40, 90],
          [0, 130],
        ]),
        'right',
      ),
      choices(
        button,
        c.button,
        around(buttonAt, [
          [0, 0],
          [0, 40],
          [0, -40],
          [30, 70],
          [30, -70],
        ]),
        'left',
        1.5,
      ),
    ],
    targets: [ribbon, button, at('banner')],
    avoid: texts(),
  };
}

/** Slide 2: production, staging and test side by side, the host and its mark colour under each. */
function environments(c: Copy['environments'], shots: Shot[]): Composed {
  const colors = [MARK.red, MARK.amber, MARK.blue];
  const [width, gap] = [354, 40];
  const frames = shots.map((shot, i) => {
    const scale = width / shot.width;
    const height = shot.height * scale;
    // The three frames and their host lines, centred between the frame edges.
    const top = (FRAME.top + FRAME.bottom - (height + CHROME.y + 3) - 60) / 2 + CHROME.y;
    const [x, y] = [FRAME.margin + 3 + i * (width + 6 + gap), top + (i % 2) * 12];
    return `${frame(x, y, width, height, shot, place(shot, 0, 0, scale).img(0, 0))}
      <div class="host" style="left:${x}px;top:${y + height + 22}px"><span class="dot" style="background:${colors[i]}"></span>${html(shot.host)}</div>`;
  });
  return { body: `${header(c.head, c.sub)}${frames.join('')}`, notes: [], targets: [], avoid: [] };
}

/** The popup over its page, coming from the toolbar icon at the frame's top right (slides 3 and 6). */
function popupOver(page: Shot, panel: Shot, x: number, width: number) {
  const scale = width / page.width;
  const [y, height] = [VIEW.top, VIEW.height];
  const popupScale = Math.min(1.35, (height - 4) / panel.height);
  const left = width - 10 - panel.width * popupScale;
  const popup = place(panel, x + left, y + 4, popupScale);
  const body = `${place(page, 0, 0, scale).img(0, 0)}${place(panel, 0, 0, popupScale).img(left, 4, 'border-radius:8px;box-shadow:0 8px 32px rgb(0 0 0/35%),0 0 0 1px rgb(0 0 0/20%)')}`;
  // Page text under the popup is hidden, so a note may go there.
  const cover = { x: x + left, y, width: panel.width * popupScale, height };
  const visible = place(page, x, y, scale)
    .texts()
    .filter((box) => box.x + box.width > x && box.x < cover.x);
  return {
    html: frame(x, y, width, height, page, body, true),
    at: popup.at,
    left: x + left,
    avoid: visible,
  };
}

function popupSlide(c: Copy['popup'], shots: Shots['popup']): Composed {
  const popup = popupOver(shots.page, shots.panel, FRAME.margin + CHROME.x, WIDE);
  const button = popup.at('button');
  const from: [number, number] = [popup.left - 90, button.y + button.height / 2];
  const steps: [number, number][] = [
    [0, 0],
    [0, 60],
    [0, -60],
    [0, 120],
    [-60, 180],
    [0, -120],
    [-120, 0],
  ];
  return {
    body: `${header(c.head, c.sub)}${popup.html}`,
    notes: [choices(button, c.click, around(from, steps), 'right')],
    targets: [button],
    avoid: popup.avoid,
  };
}

function picker(c: Copy['picker'], shot: Shot): Composed {
  const room = 380;
  const scale = Math.min(1.4, VIEW.height / shot.height, (WIDE - room) / shot.width);
  const [width, height] = [shot.width * scale, shot.height * scale];
  // Room on the right for the note.
  const [x, y] = [1280 - FRAME.margin - room - width, VIEW.top];
  const { at, texts } = place(shot, x, y, scale);
  const save = at('save');
  const from: [number, number] = [x + width + 50, save.y - 30];
  return {
    body: `${header(c.head, c.sub)}${frame(x, y, width, height, shot, place(shot, 0, 0, scale).img(0, 0))}`,
    notes: [
      choices(
        save,
        c.save,
        around(from, [
          [0, 0],
          [0, -80],
          [0, 60],
        ]),
        'left',
        1.5,
      ),
    ],
    targets: [save, at('delete')],
    avoid: texts(),
  };
}

export type Slide = {
  file: string;
  /** The slide without its notes. */
  html: string;
  /** Per note, the places it may go, best first. */
  notes: string[][];
  /** Boxes a note may never cover: what the arrows point at, and the marks. */
  targets: Box[];
  /** The page's own text, which a note may not cover either. */
  avoid: Box[];
};

/** The six store images of one language, in upload order (Chrome takes the first five). */
export function slides(locale: Locale, shots: Shots, theme: ScreenshotTheme): Slide[] {
  const c = COPY[locale];
  const privacy = popupOver(shots.privacy.page, shots.privacy.panel, FRAME.margin + 3, 760);
  const list: (Composed & { file: string })[] = [
    { file: '1-production', ...production(c.production, shots.production) },
    { file: '2-environments', ...environments(c.environments, shots.environments) },
    { file: '3-popup', ...popupSlide(c.popup, shots.popup) },
    { file: '4-picker', ...picker(c.picker, shots.picker) },
    { file: '5-options', ...options(c.options, shots.options) },
    {
      file: '6-privacy',
      body: `${header(c.privacy.head, c.privacy.sub)}${privacy.html}<ul class="checks" style="left:870px;top:${VIEW.top}px;width:350px">${c.privacy.checks.map((line) => `<li>${html(line)}</li>`).join('')}</ul>`,
      notes: [],
      targets: [],
      avoid: [],
    },
  ];
  const tokens = theme === 'dark' ? DARK : LIGHT;
  return list.map(({ file, body, notes, targets, avoid }) => ({
    file,
    notes,
    targets,
    avoid,
    html: `<style>:root{${tokens}}${CSS}</style>${body}`,
  }));
}
