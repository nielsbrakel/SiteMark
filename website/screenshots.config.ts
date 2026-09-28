import path from 'node:path';
import { defineConfig } from '@playwright/test';

const repository = path.resolve(import.meta.dirname, '..');
const PORT = Number(process.env.WEBSITE_E2E_PORT ?? 4174);

// The image generators (D-251): website/scripts/screenshots.ts drives the extension's e2e build
// (it serves its own demo page), website/scripts/playground-preview.ts captures the built
// website's playground (REQ-PLAY-003) from `vite preview`. `pnpm web:screenshots` builds both
// first. They are generators, not test suites, so no test run includes them.
export default defineConfig({
  testDir: 'scripts',
  testMatch: ['screenshots.ts', 'playground-preview.ts'],
  workers: 1,
  timeout: 180_000,
  reporter: 'list',
  outputDir: path.join(repository, 'test-results/screenshots'),
  webServer: {
    command: `pnpm exec vite preview --host 127.0.0.1 --port ${PORT} --strictPort`,
    cwd: import.meta.dirname,
    url: `http://127.0.0.1:${PORT}/SiteMark/`,
    reuseExistingServer: !process.env.CI,
    timeout: 20_000,
  },
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    ...(process.env.PW_CHROMIUM_EXECUTABLE && {
      launchOptions: { executablePath: process.env.PW_CHROMIUM_EXECUTABLE },
    }),
  },
});
