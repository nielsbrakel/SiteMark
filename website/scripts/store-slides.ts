// The look of the store images (docs/design.md): paper sheets taped to the kraft board, tape-colored
// notes, a marker highlight under the key word and the wavy divider. The captures come in as PNGs and the
// slides come out as HTML for store-shots.ts to screenshot. Hex values are the light tokens of tokens.css.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Locale } from '../src/i18n/locales';

const INK = '#33261b';
const BOARD = '#c9a77c';
const SURFACE = '#fbf6e8';
const PANEL = '#fffefa';
const EDGE = '#d9ccb0';
const SHADE = 'rgb(60 35 15 / 28%)';
const RULE = 'rgb(51 38 27 / 18%)';
const HIGHLIGHT = '#f5cf5a';
const [YELLOW, BLUE, GREEN, PINK] = ['#f5cf5a', '#8fc8e8', '#9bd6a8', '#f4a3b5'] as const;

const repository = path.resolve(import.meta.dirname, '../..');
const font = (family: string, file: string) =>
  `@font-face{font-family:'${family}';src:url(data:font/woff2;base64,${readFileSync(
    path.join(repository, 'src/assets/fonts', file),
  ).toString('base64')})}`;
const wave = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='6'><path d='M0 3Q4 0 8 3T16 3' fill='none' stroke='#000' stroke-width='1.5'/></svg>",
)}")`;

const CSS = `${font('Caveat Brush', 'caveat-brush-latin.woff2')}${font('Patrick Hand', 'patrick-hand-latin.woff2')}
html,body{margin:0}*{box-sizing:border-box}
body{width:1280px;height:800px;background:${BOARD};font:26px 'Patrick Hand',sans-serif;color:${INK};position:relative;overflow:hidden}
h1{margin:0;position:absolute;top:26px;left:0;right:0;text-align:center;font:400 58px/1.1 'Caveat Brush',sans-serif}
h1 em{font-style:normal;padding:0 6px;background:linear-gradient(transparent 62%,${HIGHLIGHT} 62% 92%,transparent 92%)}
.sub{margin:0;position:absolute;top:94px;left:0;right:0;text-align:center}
.sheet{position:absolute;border:3px solid ${INK};border-radius:6px;background:${SURFACE};overflow:hidden;box-shadow:0 3px 0 ${EDGE},0 10px 16px -6px ${SHADE}}
.sheet img{position:absolute;display:block}
.tape{position:absolute;width:96px;height:26px;opacity:.92;transform:rotate(-3deg);z-index:3;box-shadow:0 1px 2px ${SHADE};background:repeating-linear-gradient(45deg,rgb(255 255 255/40%) 0 5px,transparent 5px 10px),var(--c)}
.note{position:absolute;z-index:4;padding:12px 18px;border:3px solid ${INK};border-radius:3px;box-shadow:1px 3px 0 ${INK};font:400 30px/1.15 'Caveat Brush',sans-serif}
.card{position:absolute;padding:26px 24px;border:3px solid ${INK};border-radius:3px;background:${PANEL};text-align:center;line-height:1.3;box-shadow:0 3px 0 ${EDGE},0 10px 16px -6px ${SHADE}}
.card b{display:block;margin-bottom:8px;font:400 38px 'Caveat Brush',sans-serif}
.badges{position:absolute;left:0;right:0;top:620px;display:flex;gap:30px;justify-content:center}
.badge{padding:6px 20px;border:3px solid ${INK};border-radius:3px;background:${SURFACE};box-shadow:1px 3px 0 ${INK}}
.wave{position:absolute;left:60px;width:1160px;top:560px;height:6px;background:${INK};opacity:.7;mask:${wave} repeat-x center/16px 6px}
.ruled{position:absolute;inset:0;padding:40px 48px;font-size:34px;line-height:64px;background:repeating-linear-gradient(transparent 0 31px,${RULE} 31px 32px),${SURFACE}}
.ruled b{font:400 44px 'Caveat Brush',sans-serif}
.ring{position:absolute;left:0;top:0;overflow:visible}`;

export type Copy = {
  marked: { head: [string, string, string]; sub: string; ribbon: string; banner: string };
  versus: {
    head: [string, string, string];
    sub: string;
    test: string;
    production: string;
    badge: string;
  };
  popup: { head: [string, string, string]; sub: string; title: string; steps: string[] };
  picker: { head: [string, string, string]; sub: string; note: string };
  privacy: {
    head: [string, string, string];
    sub: string;
    cards: [string, string][];
    badges: string[];
  };
  options: { head: [string, string, string]; sub: string; note: string };
};

export const COPY: Record<Locale, Copy> = {
  en: {
    marked: {
      head: ['Production, ', 'impossible to miss', ''],
      sub: 'A ribbon, banner and frame on exactly the sites you choose',
      ribbon: 'Corner ribbon,<br>always labelled',
      banner: 'Banner: changes are live',
    },
    versus: {
      head: ['Which one is ', 'production?', ''],
      sub: 'With SiteMark you never have to guess',
      test: 'Test or production?',
      production: 'Marked: production',
      badge: 'Never mix up the two again',
    },
    popup: {
      head: ['Mark a site ', 'in one click', ''],
      sub: 'Access is asked for one site at a time',
      title: 'How it works',
      steps: [
        'Open the popup',
        'Press Mark this site',
        'Allow that one site',
        'Done: ribbon, banner, frame',
      ],
    },
    picker: {
      head: ['Protect ', 'the button that matters', ''],
      sub: 'Pick any element and give it a ribbon or an outline',
      note: 'Delete customer<br>now stands out',
    },
    privacy: {
      head: ['Private ', 'by design', ''],
      sub: 'Your sites, your browser, nothing else',
      cards: [
        ['No data collected', 'No accounts, no analytics, no servers'],
        ['One site at a time', 'No access until you add a site, then only that site'],
        ['Free and open', 'On Chrome, Edge and Firefox, in English and Dutch'],
      ],
      badges: ['Environment indicator', 'Collects no data', 'No remote code'],
    },
    options: {
      head: ['Fine-tune ', 'every mark', ''],
      sub: 'Ribbon, banner, frame, tint, title prefix. See it live before you save',
      note: 'Live preview<br>of every change',
    },
  },
  nl: {
    marked: {
      head: ['Productie, ', 'onmiskenbaar', ''],
      sub: 'Een lint, banner en kader op precies de sites die jij kiest',
      ribbon: 'Lint in de hoek,<br>altijd met tekst',
      banner: 'Banner: wijzigingen zijn live',
    },
    versus: {
      head: ['Welke is ', 'productie?', ''],
      sub: 'Met SiteMark hoef je nooit te gokken',
      test: 'Test of productie?',
      production: 'Gemarkeerd: productie',
      badge: 'Verwar de twee nooit meer',
    },
    popup: {
      head: ['Markeer een site ', 'met één klik', ''],
      sub: 'Toegang wordt per site gevraagd',
      title: 'Zo werkt het',
      steps: [
        'Open het pop-upvenster',
        'Kies Deze site markeren',
        'Sta alleen die ene site toe',
        'Klaar: lint, banner, kader',
      ],
    },
    picker: {
      head: ['Bescherm ', 'de knop die ertoe doet', ''],
      sub: 'Kies een element en geef het een lint of kader',
      note: 'Klant verwijderen<br>valt nu op',
    },
    privacy: {
      head: ['Privé ', 'als uitgangspunt', ''],
      sub: 'Jouw sites, jouw browser, verder niets',
      cards: [
        ['Geen data verzameld', 'Geen accounts, geen analytics, geen servers'],
        ['Eén site tegelijk', 'Geen toegang totdat je een site toevoegt, en dan alleen die site'],
        ['Gratis en open', 'Voor Chrome, Edge en Firefox, in het Nederlands en Engels'],
      ],
      badges: ['Omgevingsindicator', 'Verzamelt geen gegevens', 'Geen externe code'],
    },
    options: {
      head: ['Stel ', 'elke markering', ' af'],
      sub: 'Lint, banner, kader, tint, titelvoorvoegsel. Zie het live voor je opslaat',
      note: 'Voorbeeld van<br>elke wijziging',
    },
  },
};

export type Shots = {
  marked: string;
  unmarked: string;
  picker: string;
  popup: string;
  options: string;
};

const html = (text: string) => text.replace(/[&<>]/g, (c) => `&#${c.charCodeAt(0)};`);
const header = ([a, em, b]: [string, string, string], sub: string) =>
  `<h1>${html(a)}<em>${html(em)}</em>${html(b)}</h1><p class="sub">${html(sub)}</p>`;
const tape = (x: number, y: number, color: string) =>
  `<div class="tape" style="left:${x}px;top:${y}px;--c:${color}"></div>`;
const note = (color: string, x: number, y: number, rotate: number, text: string) =>
  `<div class="note" style="left:${x}px;top:${y}px;background:${color};transform:rotate(${rotate}deg)">${text}</div>`;

/** A taped paper sheet showing the part of a 1280 × 800 capture that starts at (cropX, cropY), scaled by `scale`. */
function sheet(
  box: [number, number, number, number],
  tapeColor: string,
  src: string,
  scale: number,
  crop: [number, number] = [0, 0],
): string {
  const [x, y, w, h] = box;
  return `${tape(x + w / 2 - 48, y - 14, tapeColor)}<div class="sheet" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"><img src="${src}" style="width:${1280 * scale}px;left:${-crop[0] * scale}px;top:${-crop[1] * scale}px"></div>`;
}

const ring = (d: string) =>
  `<svg class="ring" width="1280" height="800"><path d="${d}" fill="none" stroke="#ef7a60" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export type Slide = { file: string; html: string };

/** The six store images of one language, in upload order (Chrome takes the first five). */
export function slides(locale: Locale, shots: Shots): Slide[] {
  const c = COPY[locale];
  return [
    {
      file: '1-marked-page',
      html: `${header(c.marked.head, c.marked.sub)}${sheet([150, 168, 980, 612], BLUE, shots.marked, 980 / 1280)}
        ${ring('M1020 185 q38 -14 70 18 q26 40 -16 64 q-52 20 -82 -12 q-18 -34 28 -70')}
        ${note(PINK, 822, 296, -2, c.marked.ribbon)}${note(GREEN, 170, 690, 2, html(c.marked.banner))}`,
    },
    {
      file: '2-production-vs-test',
      html: `${header(c.versus.head, c.versus.sub)}
        ${sheet([60, 260, 560, 335], YELLOW, shots.unmarked, 560 / 1280)}${sheet([660, 260, 560, 335], YELLOW, shots.marked, 560 / 1280)}
        ${note(YELLOW, 90, 186, -2, html(c.versus.test))}${note(PINK, 690, 186, 2, html(c.versus.production))}
        <div class="badges" style="top:664px"><div class="badge">${html(c.versus.badge)}</div></div>`,
    },
    {
      file: '3-popup',
      html: `${header(c.popup.head, c.popup.sub)}${tape(358, 186, GREEN)}
        <div class="sheet" style="left:70px;top:200px;width:640px;height:500px"><div class="ruled"><b>${html(c.popup.title)}</b><br>${c.popup.steps.map((s, i) => `${i + 1}. ${html(s)}`).join('<br>')}</div></div>
        ${tape(902, 176, YELLOW)}<div class="sheet" style="left:850px;top:190px;width:366px;height:fit-content"><img src="${shots.popup}" style="position:static;width:360px"></div>`,
    },
    {
      file: '4-picker',
      html: `${header(c.picker.head, c.picker.sub)}${sheet([150, 168, 980, 612], PINK, shots.picker, 980 / 1280)}${note(BLUE, 700, 640, -2, c.picker.note)}`,
    },
    {
      file: '5-privacy',
      html: `${header(c.privacy.head, c.privacy.sub)}
        ${c.privacy.cards.map(([title, text], i) => `${tape(122 + i * 380, 252, [YELLOW, BLUE, GREEN][i] ?? YELLOW)}<div class="card" style="left:${60 + i * 380}px;top:270px;width:360px;height:210px;transform:rotate(${[-1.5, 1, -1][i]}deg)"><b>${html(title)}</b>${html(text)}</div>`).join('')}
        <div class="wave"></div><div class="badges">${c.privacy.badges.map((b) => `<div class="badge">${html(b)}</div>`).join('')}</div>`,
    },
    {
      file: '6-options',
      html: `${header(c.options.head, c.options.sub)}${sheet([40, 170, 740, 590], BLUE, shots.options, 0.8, [235, 40])}
        ${sheet([840, 250, 400, 250], PINK, shots.marked, 0.3125)}${note(YELLOW, 880, 570, -2, c.options.note)}`,
    },
  ].map(({ file, html: body }) => ({ file, html: `<style>${CSS}</style>${body}` }));
}
