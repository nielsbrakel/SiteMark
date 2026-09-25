import { notImplemented } from '@/core/not-implemented';

/** Built client files, relative to the client output directory (from the Vite manifest). */
export type PageAssets = { script: string; styles: readonly string[] };

/** One prerendered HTML file, relative to the client output directory. */
export type RenderedPage = { file: string; html: string };

/** Every published route that has a page, in every locale, as a complete HTML document. */
export function renderPages(_assets: PageAssets): Promise<RenderedPage[]> {
  return notImplemented();
}
