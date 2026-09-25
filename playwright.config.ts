import { defineConfig } from '@playwright/test';
import { E2E_PORT } from './tests/e2e/hosts';

const ci = Boolean(process.env.CI);

// Extensions only load in a persistent Chromium context, see tests/e2e/fixtures.ts.
// `pnpm test:e2e` builds the e2e variant first (`wxt build --mode e2e` → .output/chrome-mv3-e2e).
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: ci,
  retries: ci ? 1 : 0,
  // A test that only passes on retry is a bug, not a pass (TEST-09).
  failOnFlakyTests: ci,
  timeout: 30_000,
  reporter: ci ? [['github'], ['html', { open: 'never' }]] : 'list',
  webServer: {
    command: 'node tests/e2e/serve.mjs',
    url: `http://127.0.0.1:${E2E_PORT}/`,
    env: { E2E_PORT: String(E2E_PORT) },
    reuseExistingServer: !ci,
    timeout: 10_000,
  },
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
