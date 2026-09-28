import path from 'node:path';
import { defineConfig } from '@playwright/test';

const repository = path.resolve(import.meta.dirname, '..');

// The screenshot generator (D-251, T-230): Playwright drives the extension's e2e build and writes
// the website and store screenshots (website/scripts/screenshots.ts serves its own demo page, so no
// fixture server is needed). `pnpm web:screenshots` builds the extension first. It is a generator,
// not a test suite, so `pnpm test:e2e` never runs it.
export default defineConfig({
  testDir: 'scripts',
  testMatch: 'screenshots.ts',
  workers: 1,
  timeout: 180_000,
  reporter: 'list',
  outputDir: path.join(repository, 'test-results/screenshots'),
});
