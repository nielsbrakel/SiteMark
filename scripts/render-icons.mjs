// Renders design/logo/*.svg into the PNG toolbar/store icons in public/icon/, and
// design/social-preview.svg into the GitHub social preview (design/social-preview.png).
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

const preview = await readFile('design/social-preview.svg', 'utf8');
await page.setViewportSize({ width: 1280, height: 640 });
await page.setContent(
  `<style>html,body{margin:0}svg{display:block;width:1280px;height:640px}</style>${preview}`,
);
await page.locator('svg').screenshot({ path: 'design/social-preview.png' });
console.log('design/social-preview.png');

await browser.close();
