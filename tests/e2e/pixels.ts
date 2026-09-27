import { inflateSync } from 'node:zlib';
import type { Page } from '@playwright/test';

// Reads pixels from a Playwright screenshot, to check what is really painted on top (the top layer
// can't be queried: marks ignore the pointer, so elementFromPoint never returns them).

export type Rgb = readonly [number, number, number];

type Png = { width: number; channels: number; rows: Buffer[] };

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const [pa, pb, pc] = [Math.abs(p - a), Math.abs(p - b), Math.abs(p - c)];
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

function unfilter(filter: number, row: Buffer, prev: Buffer, bpp: number): void {
  for (let i = 0; i < row.length; i++) {
    const left = i >= bpp ? (row[i - bpp] ?? 0) : 0;
    const up = prev[i] ?? 0;
    const upLeft = i >= bpp ? (prev[i - bpp] ?? 0) : 0;
    const add = [0, left, up, (left + up) >> 1, paeth(left, up, upLeft)][filter] ?? 0;
    row[i] = ((row[i] ?? 0) + add) & 0xff;
  }
}

/** Decodes an 8-bit, non-interlaced RGB or RGBA PNG (what Chromium's screenshots are). */
function decode(png: Buffer): Png {
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  const channels = png[25] === 6 ? 4 : 3;
  const chunks: Buffer[] = [];
  for (let at = 8; at < png.length; ) {
    const length = png.readUInt32BE(at);
    if (png.toString('ascii', at + 4, at + 8) === 'IDAT') {
      chunks.push(png.subarray(at + 8, at + 8 + length));
    }
    at += length + 12;
  }
  const data = inflateSync(Buffer.concat(chunks));
  const stride = width * channels;
  const rows: Buffer[] = [];
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const start = y * (stride + 1);
    const row = Buffer.from(data.subarray(start + 1, start + 1 + stride));
    unfilter(data[start] ?? 0, row, prev, channels);
    rows.push(row);
    prev = row;
  }
  return { width, channels, rows };
}

/** The color painted at CSS pixel (x, y) of the viewport (device scale factor 1). */
export async function pixelAt(page: Page, x: number, y: number): Promise<Rgb> {
  const { channels, rows } = decode(await page.screenshot());
  const row = rows[Math.round(y)] ?? Buffer.alloc(0);
  const at = Math.round(x) * channels;
  return [row[at] ?? 0, row[at + 1] ?? 0, row[at + 2] ?? 0];
}
