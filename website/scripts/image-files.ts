import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { BrowserContext } from '@playwright/test';

// Shared by the image generators (T-230, T-234): WebP encoding and writing into website/public.

const PUBLIC = path.resolve(import.meta.dirname, '../public');

/** The same image as WebP, encoded by the browser (no image library needed). */
export async function toWebp(context: BrowserContext, png: Buffer): Promise<Buffer> {
  const page = await context.newPage();
  const base64 = await page.evaluate(async (source) => {
    const image = new Image();
    image.src = `data:image/png;base64,${source}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    canvas.getContext('2d')?.drawImage(image, 0, 0);
    return canvas.toDataURL('image/webp', 0.82).split(',')[1] ?? '';
  }, png.toString('base64'));
  await page.close();
  return Buffer.from(base64, 'base64');
}

/** Writes a file below website/public, e.g. `screenshots/popup-dark-nl.png`. */
export function writePublic(file: string, data: Buffer): void {
  const target = path.join(PUBLIC, file);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, data);
}
