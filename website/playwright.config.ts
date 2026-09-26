import path from 'node:path';
import { defineConfig } from '@playwright/test';

const ci = Boolean(process.env.CI);
const chromium = process.env.PW_CHROMIUM_EXECUTABLE;
const PORT = 4174;
const repository = path.resolve(import.meta.dirname, '..');

// Website e2e (docs/website/plan.md §7): Playwright against `vite preview` of the built website,
// under the real base path /SiteMark/. `pnpm web:test:e2e` builds the website first.
export default defineConfig({
  testDir: 'tests/e2e',
  forbidOnly: ci,
  retries: ci ? 1 : 0,
  // A test that only passes on retry is a bug, not a pass (TEST-09).
  failOnFlakyTests: ci,
  timeout: 30_000,
  // playwright-website.json feeds requirement coverage (`pnpm progress --coverage`).
  reporter: [
    ci ? ['github'] : ['list'],
    ['html', { open: 'never', outputFolder: path.join(repository, 'playwright-report/website') }],
    ['json', { outputFile: path.join(repository, 'test-results/playwright-website.json') }],
  ],
  outputDir: path.join(repository, 'test-results/website-e2e'),
  webServer: {
    command: `pnpm exec vite preview --host 127.0.0.1 --port ${PORT} --strictPort`,
    cwd: import.meta.dirname,
    url: `http://127.0.0.1:${PORT}/SiteMark/`,
    reuseExistingServer: !ci,
    timeout: 20_000,
  },
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    browserName: 'chromium',
    ...(chromium && { launchOptions: { executablePath: chromium } }),
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
