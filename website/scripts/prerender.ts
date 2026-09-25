// Prerender (docs/website/plan.md §3, D-245): after the client and SSR builds, writes one HTML file
// per route and locale into dist/client, which is the GitHub Pages artifact.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { PageAssets, renderPages } from '../src/entry-server.tsx';

type ManifestChunk = { file: string; css?: string[] };

const website = path.resolve(import.meta.dirname, '..');
const client = path.join(website, 'dist/client');
const manifestDir = path.join(client, '.vite');

/** The hashed client entry and its CSS, from the Vite manifest. */
function clientAssets(): PageAssets {
  const manifest = JSON.parse(
    readFileSync(path.join(manifestDir, 'manifest.json'), 'utf8'),
  ) as Record<string, ManifestChunk>;
  const entry = manifest['src/entry-client.ts'];
  if (!entry) throw new Error('The client build has no src/entry-client.ts entry');
  return { script: entry.file, styles: entry.css ?? [] };
}

const server = (await import(
  pathToFileURL(path.join(website, 'dist/server/entry-server.js')).href
)) as {
  renderPages: typeof renderPages;
};
const pages = await server.renderPages(clientAssets());
for (const page of pages) {
  const file = path.join(client, page.file);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, page.html);
}
// The manifest was only needed here; it isn't part of the website.
rmSync(manifestDir, { recursive: true, force: true });
console.log(`Prerendered ${pages.length} pages into ${path.relative(process.cwd(), client)}`);
