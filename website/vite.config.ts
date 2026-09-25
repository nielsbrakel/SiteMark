import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// The website (docs/website/plan.md §3): a GitHub Pages project site, so every URL carries the base path.
export default defineConfig({
  base: '/SiteMark/',
  resolve: {
    // Extension code is imported through `@/` only (D-246), the same alias the extension uses.
    alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) },
  },
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
    // The modulepreload polyfill ships a fetch() (REQ-WEB-003); every supported browser has it natively.
    modulePreload: { polyfill: false },
  },
});
