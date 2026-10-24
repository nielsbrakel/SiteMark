// The store images (store/listing.md): real captures composed into 1280 × 800 slides. The captures
// come in as 2× PNGs with the boxes Playwright measured; the slides come out as HTML for
// store-shots.ts to screenshot.
import type { Locale } from '../src/i18n/locales';
import {
  type Box,
  CHROME,
  CSS,
  callout,
  DARK,
  frame,
  header,
  html,
  LIGHT,
  MARK,
  place,
  type Shot,
  type Shots,
} from './store-art';
import { COPY, type Copy } from './store-copy';

/** Slide 1: the production page, fully marked, at 0.875 so the whole viewport shows. */
function production(c: Copy['production'], shot: Shot) {
  const scale = 0.875;
  const [x, y] = [80, 790 - 3 - shot.height * scale];
  const { at } = place(shot, x, y, scale);
  const [ribbon, button] = [at('ribbon'), at('delete')];
  return {
    body: `${header(c.head, c.sub)}${frame(x, y, shot.width * scale, shot.height * scale, shot, place(shot, 0, 0, scale).img(0, 0))}
      ${callout(ribbon, c.ribbon, [ribbon.x - 70, ribbon.y + ribbon.height / 2], 'right')}
      ${callout(button, c.button, [button.x + button.width / 2 + 90, button.y + button.height + 60], 'up', 1.5)}`,
    targets: [ribbon, button, at('banner')],
  };
}

/** Slide 2: production, staging and test side by side, the host and its mark colour under each. */
function environments(c: Copy['environments'], shots: Shot[]) {
  const colors = [MARK.red, MARK.amber, MARK.blue];
  const frames = shots.map((shot, i) => {
    const scale = 384 / shot.width;
    const [x, y] = [43 + i * 405, 330 + (i % 2) * 12];
    const height = shot.height * scale;
    return `${frame(x, y, 384, height, shot, place(shot, 0, 0, scale).img(0, 0))}
      <div class="host" style="left:${x}px;top:${y + height + 22}px"><span class="dot" style="background:${colors[i]}"></span>${html(shot.host)}</div>`;
  });
  return { body: `${header(c.head, c.sub)}${frames.join('')}`, targets: [] };
}

/** The popup over its page, coming from the toolbar icon at the frame's top right (slides 3 and 6). */
function popupOver(page: Shot, panel: Shot, x: number, width: number) {
  const scale = width / page.width;
  const [y, height] = [160 + CHROME.y, 790 - 3 - 160 - CHROME.y];
  const popupScale = Math.min(1.35, (height - 4) / panel.height);
  const left = width - 10 - panel.width * popupScale;
  const popup = place(panel, x + left, y + 4, popupScale);
  const body = `${place(page, 0, 0, scale).img(0, 0)}${place(panel, 0, 0, popupScale).img(left, 4, 'border-radius:8px;box-shadow:0 8px 32px rgb(0 0 0/35%),0 0 0 1px rgb(0 0 0/20%)')}`;
  return { html: frame(x, y, width, height, page, body, true), at: popup.at, left: x + left };
}

function picker(c: Copy['picker'], shot: Shot) {
  const scale = Math.min(1.4, 556 / shot.height);
  const [width, height] = [shot.width * scale, shot.height * scale];
  const [x, y] = [1280 - 400 - width, 790 - 3 - height];
  const { at } = place(shot, x, y, scale);
  const save = at('save');
  return {
    body: `${header(c.head, c.sub)}${frame(x, y, width, height, shot, place(shot, 0, 0, scale).img(0, 0))}${callout(save, c.save, [x + width + 50, save.y - 30], 'left', 1.5)}`,
    targets: [save, at('delete')],
  };
}

function options(c: Copy['options'], { form, preview }: Shots['options']) {
  const [x, y, width, height] = [80, 160 + CHROME.y, 1120, 790 - 3 - 160 - CHROME.y];
  const formScale = Math.min(1.25, (height - 40) / form.height);
  const previewScale = (width - 60 - form.width * formScale) / preview.width;
  const [fx, fy] = [20, (height - form.height * formScale) / 2];
  const [px, py] = [40 + form.width * formScale, height - 30 - preview.height * previewScale];
  const sheet = 'border:2px solid #33261b;border-radius:3px;box-shadow:0 3px 0 #d9ccb0';
  const swatches = place(form, x + fx, y + fy, formScale).at('swatches');
  const figure = place(preview, x + px, y + py, previewScale).at('figure');
  const body = `<div style="position:absolute;inset:0;background:var(--board)"></div>${place(form, 0, 0, formScale).img(fx, fy, sheet)}${place(preview, 0, 0, previewScale).img(px, py, sheet)}`;
  return {
    body: `${header(c.head, c.sub)}${frame(x, y, width, height, form, body)}
      ${callout(swatches, c.presets, [swatches.x + swatches.width + 70, swatches.y + swatches.height / 2], 'left', 1.5)}
      ${callout(figure, c.preview, [figure.x + figure.width / 2, figure.y - 70], 'down')}`,
    targets: [swatches, figure],
  };
}

export type Slide = { file: string; html: string; dark: boolean; targets: Box[] };

/** The six store images of one language, in upload order (Chrome takes the first five). */
export function slides(locale: Locale, shots: Shots): Slide[] {
  const c = COPY[locale];
  const popup = popupOver(shots.popup.page, shots.popup.panel, 53, 1174);
  const button = popup.at('button');
  const privacy = popupOver(shots.privacy.page, shots.privacy.panel, 43, 760);
  const list = [
    { file: '1-production', ...production(c.production, shots.production) },
    { file: '2-environments', ...environments(c.environments, shots.environments) },
    {
      file: '3-popup',
      body: `${header(c.popup.head, c.popup.sub)}${popup.html}${callout(button, c.popup.click, [popup.left - 90, button.y + button.height / 2], 'right')}`,
      targets: [button],
    },
    { file: '4-picker', ...picker(c.picker, shots.picker) },
    { file: '5-options', ...options(c.options, shots.options) },
    {
      file: '6-privacy-dark',
      body: `${header(c.privacy.head, c.privacy.sub)}${privacy.html}<ul class="checks" style="left:850px;top:250px;width:400px">${c.privacy.checks.map((line) => `<li>${html(line)}</li>`).join('')}</ul>`,
      targets: [],
    },
  ];
  return list.map(({ file, body, targets }) => {
    const dark = file.endsWith('dark');
    return {
      file,
      dark,
      targets,
      html: `<style>:root{${dark ? DARK : LIGHT}}${CSS}</style>${body}`,
    };
  });
}
