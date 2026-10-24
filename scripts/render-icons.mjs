// Renders design/logo/*.svg into the PNG toolbar/store icons in public/icon/, and
// design/social-preview.svg into the GitHub social preview (design/social-preview.png) and the
// per-language link previews (design/social-preview-{en,nl}.png), and
// design/{promo,marquee}-tile.svg into the localised store promo tiles (T-152). It then collects
// the icons and tiles into store/images/ (store/listing.md says which store takes which; the framed
// screenshots come from `pnpm web:screenshots`).
// Usage: pnpm icons   (set PW_CHROMIUM_EXECUTABLE to use a preinstalled Chromium)
import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

// The promo art sets its lettering in the bundled handwriting fonts (D-289).
const fontFace = async (family, file) =>
  `@font-face{font-family:'${family}';src:url(data:font/woff2;base64,${(await readFile(`src/assets/fonts/${file}`)).toString('base64')})}`;
const fonts = `${await fontFace('Caveat Brush', 'caveat-brush-latin.woff2')}${await fontFace('Patrick Hand', 'patrick-hand-latin.woff2')}`;

/**
 * Draws the marker highlight (D-289) behind every `tspan.hl` of the rendered SVG: a yellow band over
 * the lower part of the word, as on the store slides. Measured after the fonts load, so it fits the
 * word in every language.
 */
async function highlight(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (const word of document.querySelectorAll('tspan.hl')) {
      const box = word.getBBox();
      const band = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      const [x, y] = [box.x - 6, box.y + box.height * 0.55];
      const attributes = {
        x,
        y,
        width: box.width + 12,
        height: box.height * 0.27,
        fill: '#f5cf5a',
      };
      for (const [name, value] of Object.entries(attributes))
        band.setAttribute(name, String(value));
      band.setAttribute('transform', `rotate(-1 ${x + box.width / 2} ${y})`);
      word.closest('text')?.before(band);
    }
  });
}

/** Renders `markup` (with the fonts) at width × height and screenshots its SVG to `path`. */
async function renderArt(page, markup, width, height, path) {
  await page.setViewportSize({ width, height });
  await page.setContent(
    `<style>${fonts}html,body{margin:0}svg{display:block;width:${width}px;height:${height}px}</style>${markup}`,
  );
  await highlight(page);
  await page.locator('svg').screenshot({ path });
  console.log(path);
}

// The promo art in Dutch: the English SVG text swapped, per file (the line breaks differ).
const shared = [
  ['SiteMark: never mistake production for test', 'SiteMark: verwar productie nooit meer met test'],
  ['Leaf &amp; Lamp · Admin', 'Leaf &amp; Lamp · Beheer'],
  ['>CUSTOMER<', '>KLANT<'],
  ['>Delete customer<', '>Klant verwijderen<'],
  ['Production: changes are live', 'Productie: wijzigingen zijn live'],
];
// The highlighted word moves to the first line in Dutch.
const HL = (word) => `<tspan class="hl">${word}</tspan>`;
const twoLines = [
  ['>Never mistake<', `>Verwar ${HL('productie')}<`],
  [`>${HL('production')} for test<`, '>nooit meer met test<'],
];
const dutch = {
  'social-preview': [
    ...shared,
    ...twoLines,
    ['>Ribbon, banner and frame<', '>Lint, banner en kader<'],
    ['>on the sites you choose.<', '>op de sites die jij kiest.<'],
    ['Collects no data', 'Verzamelt geen gegevens'],
  ],
  'promo-tile': [
    // The small tile's window has no page text.
    ...shared.slice(0, 1),
    ['>Never mistake<', '>Verwar nooit<'],
    ['>production<', '>productie<'],
    ['>for test<', '>met test<'],
  ],
  'marquee-tile': [
    ...shared,
    ...twoLines,
    ['>Ribbon, banner and frame on the<', '>Lint, banner en kader op de sites<'],
    ['>sites you choose. Collects no data.<', '>die jij kiest. Verzamelt geen gegevens.<'],
  ],
};
const inDutch = (name, markup) =>
  dutch[name].reduce((text, [from, to]) => {
    if (!text.includes(from)) throw new Error(`design/${name}.svg has no "${from}" to translate`);
    return text.replaceAll(from, to);
  }, markup);

const targets = [
  { svg: 'design/logo/sitemark-icon-16.svg', sizes: [16] },
  { svg: 'design/logo/sitemark-icon-small.svg', sizes: [32] },
  { svg: 'design/logo/sitemark-icon.svg', sizes: [48, 96, 128] },
];

await mkdir('public/icon', { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PW_CHROMIUM_EXECUTABLE || undefined,
});
const page = await browser.newPage();

for (const { svg, sizes } of targets) {
  const markup = await readFile(svg, 'utf8');
  for (const size of sizes) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(
      `<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${markup}`,
    );
    await page.locator('svg').screenshot({ path: `public/icon/${size}.png`, omitBackground: true });
    console.log(`public/icon/${size}.png`);
  }
}

// iOS fills transparent corners with black, so the home-screen icon is the logo on the kraft board.
await page.setViewportSize({ width: 180, height: 180 });
await page.setContent(
  `<style>html,body{margin:0;background:#c9a77c}svg{display:block;width:180px;height:180px;padding:20px;box-sizing:border-box}</style>${await readFile('design/logo/sitemark-icon.svg', 'utf8')}`,
);
await page.screenshot({ path: 'design/apple-touch-icon.png' });
console.log('design/apple-touch-icon.png');

const social = await readFile('design/social-preview.svg', 'utf8');
await renderArt(page, social, 1280, 640, 'design/social-preview.png');

// Link previews (Open Graph) are 1200 × 630 and per language: the same art, cropped a little at the
// sides.
for (const lang of ['en', 'nl']) {
  const markup = (lang === 'nl' ? inDutch('social-preview', social) : social).replace(
    '<svg ',
    // biome-ignore lint/security/noSecrets: an SVG attribute, not a secret
    '<svg preserveAspectRatio="xMidYMid slice" ',
  );
  await renderArt(page, markup, 1200, 630, `design/social-preview-${lang}.png`);
}

// The store tiles are localised.
const tiles = [
  { name: 'promo-tile', file: 'promo-small-440x280', width: 440, height: 280 },
  { name: 'marquee-tile', file: 'promo-marquee-1400x560', width: 1400, height: 560 },
];
for (const lang of ['en', 'nl']) {
  await mkdir(`store/images/${lang}`, { recursive: true });
  for (const { name, file, width, height } of tiles) {
    const markup = await readFile(`design/${name}.svg`, 'utf8');
    const text = lang === 'nl' ? inDutch(name, markup) : markup;
    await renderArt(page, text, width, height, `store/images/${lang}/${file}.png`);
  }
}

// Edge asks for a 300 × 300 logo; the package doesn't ship it.
await mkdir('store/images', { recursive: true });
await page.setViewportSize({ width: 300, height: 300 });
await page.setContent(
  `<style>html,body{margin:0;background:transparent}svg{display:block;width:300px;height:300px}</style>${await readFile('design/logo/sitemark-icon.svg', 'utf8')}`,
);
await page.locator('svg').screenshot({ path: 'store/images/icon-300.png', omitBackground: true });

await browser.close();

await copyFile('public/icon/128.png', 'store/images/icon-128.png');
console.log('store/images/icon-128.png');
