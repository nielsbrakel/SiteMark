import { readFile } from 'node:fs/promises';

// The toolbar stickers (D-303): the logo of each size with a tilted sticker at the bottom right, one
// file per state, set per tab with `action.setIcon`. The cream edge shows on light and dark toolbars.
const STICKER_EDGE = '#fff8e7';
const stickers = {
  active: [
    '#17692e',
    '<path d="M86 99l9 9 17-19" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>',
  ],
  hidden: ['#6b6b6b', '<rect x="84" y="94" width="28" height="9" rx="4.5" fill="#fff"/>'],
  attention: [
    '#7d5400',
    '<rect x="94.5" y="82" width="7" height="22" rx="3.5" fill="#fff"/><circle cx="98" cy="113" r="4.5" fill="#fff"/>',
  ],
  restricted: [
    '#7d5400',
    '<path d="M87 87l22 22M109 87l-22 22" stroke="#fff" stroke-width="8" stroke-linecap="round"/>',
  ],
};
const withSticker = (markup, [color, glyph]) =>
  markup.replace(
    /<\/svg>\s*$/,
    `<g transform="rotate(-8 98 98)"><rect x="73" y="73" width="50" height="50" rx="11" fill="${color}" stroke="${STICKER_EDGE}" stroke-width="10" paint-order="stroke"/>${glyph}</g></svg>`,
  );
/** Renders the sticker icons of every toolbar-sized logo target (`targets` of render-icons.mjs). */
export async function renderStickers(page, targets) {
  for (const { svg, sizes } of targets) {
    const markup = await readFile(svg, 'utf8');
    for (const size of sizes.filter((s) => s <= 48)) {
      for (const [state, sticker] of Object.entries(stickers)) {
        await page.setViewportSize({ width: size, height: size });
        await page.setContent(
          `<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${withSticker(markup, sticker)}`,
        );
        await page
          .locator('svg')
          .screenshot({ path: `public/icon/${state}-${size}.png`, omitBackground: true });
        console.log(`public/icon/${state}-${size}.png`);
      }
    }
  }
}
