import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { devPages } from './scripts/dev-pages.ts';
import { keepCssModules } from './scripts/keep-css-modules.ts';

// The website (docs/website/plan.md §3): a GitHub Pages project site, so every URL carries the base
// path. `vite build` makes the client bundle, `vite build --ssr` the renderer that
// scripts/prerender.ts runs to write one HTML file per route (D-245).
export default defineConfig(({ isSsrBuild }) => ({
  base: '/SiteMark/',
  // Multi-page: every route is its own HTML file, and there is no client-side router.
  appType: 'mpa',
  plugins: [devPages(), keepCssModules()],
  resolve: {
    // Extension code is imported through `@/` only (D-246), the same alias the extension uses.
    alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) },
  },
  build: isSsrBuild
    ? { outDir: 'dist/server', emptyOutDir: true, assetsInlineLimit: 0 }
    : {
        outDir: 'dist/client',
        emptyOutDir: true,
        // No data: URLs: the CSP allows images from the website only (img-src 'self', REQ-WEB-005).
        // The SSR build must agree, or the server renders other URLs than the client hydrates.
        assetsInlineLimit: 0,
        // The prerender step reads the hashed entry and CSS file names from the manifest.
        manifest: true,
        rolldownOptions: { input: 'src/entry-client.ts' },
        // The modulepreload polyfill ships a fetch() (REQ-WEB-003); every supported browser has it.
        modulePreload: { polyfill: false },
      },
}));
