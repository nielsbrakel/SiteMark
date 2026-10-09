// Renders design/logo/*.svg into the PNG toolbar/store icons in public/icon/, and
// design/social-preview.svg into the GitHub social preview (design/social-preview.png), and
// design/{promo,marquee}-tile.svg into the store promo tiles (design/*-tile.png, T-152). It then
// collects every store image into store/images/ (store/listing.md says which store takes which).
// Usage: pnpm icons   (set PW_CHROMIUM_EXECUTABLE to use a preinstalled Chromium)
import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

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

const pictures = [
  { name: 'social-preview', width: 1280, height: 640 },
  { name: 'promo-tile', width: 440, height: 280 },
  { name: 'marquee-tile', width: 1400, height: 560 },
];
for (const { name, width, height } of pictures) {
  const markup = await readFile(`design/${name}.svg`, 'utf8');
  await page.setViewportSize({ width, height });
  await page.setContent(
    `<style>html,body{margin:0}svg{display:block;width:${width}px;height:${height}px}</style>${markup}`,
  );
  await page.locator('svg').screenshot({ path: `design/${name}.png` });
  console.log(`design/${name}.png`);
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
const files = [
  ['public/icon/128.png', 'icon-128.png'],
  ['design/promo-tile.png', 'promo-small-440x280.png'],
  ['design/marquee-tile.png', 'promo-marquee-1400x560.png'],
];
for (const lang of ['en', 'nl']) {
  shots.forEach((shot, i) => {
    files.push([
      `website/public/screenshots/${shot}-${lang}.png`,
      `screenshots/${lang}/${i + 1}-${shot}.png`,
    ]);
  });
}
for (const lang of ['en', 'nl'])
  await mkdir(`store/images/screenshots/${lang}`, { recursive: true });
for (const [from, to] of files) await copyFile(from, `store/images/${to}`);
console.log(`store/images: ${files.length + 1} files`);
