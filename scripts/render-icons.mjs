// Renders design/logo/*.svg into the PNG toolbar/store icons in public/icon/, and
// design/social-preview.svg into the GitHub social preview (design/social-preview.png), and
// design/promo-tile.svg into the store promo tile (design/promo-tile.png, T-152).
// Usage: pnpm icons   (set PW_CHROMIUM_EXECUTABLE to use a preinstalled Chromium)
import { mkdir, readFile } from 'node:fs/promises';
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

await browser.close();
