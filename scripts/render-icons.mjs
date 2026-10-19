// Renders design/logo/*.svg into the PNG toolbar/store icons in public/icon/, and
// design/social-preview.svg into the GitHub social preview (design/social-preview.png), and
// design/{promo,marquee}-tile.svg into the localised store promo tiles (T-152). It then collects
// every store image into store/images/ (store/listing.md says which store takes which).
// Usage: pnpm icons   (set PW_CHROMIUM_EXECUTABLE to use a preinstalled Chromium)
import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

// The promo art sets its lettering in the bundled handwriting fonts (D-289).
const fontFace = async (family, file) =>
  `@font-face{font-family:'${family}';src:url(data:font/woff2;base64,${(await readFile(`src/assets/fonts/${file}`)).toString('base64')})}`;
const fonts = `${await fontFace('Caveat Brush', 'caveat-brush-latin.woff2')}${await fontFace('Patrick Hand', 'patrick-hand-latin.woff2')}`;

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

await page.setViewportSize({ width: 1280, height: 640 });
await page.setContent(
  `<style>${fonts}html,body{margin:0}svg{display:block;width:1280px;height:640px}</style>${await readFile('design/social-preview.svg', 'utf8')}`,
);
await page.locator('svg').screenshot({ path: 'design/social-preview.png' });
console.log('design/social-preview.png');

// The store tiles are localised: the English SVG text is swapped for the Dutch text.
const dutch = [
  ['Never confuse', 'Verwar productie'],
  ['production with test.', 'nooit met test.'],
  ['PRODUCTION · BE CAREFUL', 'PRODUCTIE · PAS OP'],
  ['Private by design. Nothing leaves your browser.', 'Privé ontworpen. Niets verlaat je browser.'],
];
const tiles = [
  { name: 'promo-tile', file: 'promo-small-440x280', width: 440, height: 280 },
  { name: 'marquee-tile', file: 'promo-marquee-1400x560', width: 1400, height: 560 },
];
for (const lang of ['en', 'nl']) {
  await mkdir(`store/images/${lang}`, { recursive: true });
  for (const { name, file, width, height } of tiles) {
    let markup = await readFile(`design/${name}.svg`, 'utf8');
    if (lang === 'nl') for (const [from, to] of dutch) markup = markup.replaceAll(from, to);
    await page.setViewportSize({ width, height });
    await page.setContent(
      `<style>${fonts}html,body{margin:0}svg{display:block;width:${width}px;height:${height}px}</style>${markup}`,
    );
    await page.locator('svg').screenshot({ path: `store/images/${lang}/${file}.png` });
    console.log(`store/images/${lang}/${file}.png`);
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

const shots = [
  'marked-page-light',
  'popup-light',
  'options-light',
  'marked-page-dark',
  'popup-dark',
];
const files = [['public/icon/128.png', 'icon-128.png']];
for (const lang of ['en', 'nl']) {
  shots.forEach((shot, i) => {
    files.push([`website/public/screenshots/${shot}-${lang}.png`, `${lang}/${i + 1}-${shot}.png`]);
  });
}
for (const [from, to] of files) await copyFile(from, `store/images/${to}`);
console.log(`store/images: ${files.length} files copied`);
