import { type RenderedPage, renderPages } from '../../src/entry-server';

/** Every prerendered page, as the build writes it (with stand-in asset names). */
export function prerenderedPages(): Promise<RenderedPage[]> {
  return renderPages({ script: 'assets/entry-client.js', styles: ['assets/entry-client.css'] });
}
