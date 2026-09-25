import { test as base, chromium, type BrowserContext } from '@playwright/test';
import path from 'node:path';

const extensionPath = path.resolve('.output/chrome-mv3');

/**
 * Loads the built Chromium extension into a persistent context.
 * Run `pnpm build` first (`pnpm test:e2e` does this for you).
 * Set PW_CHROMIUM_EXECUTABLE to use a preinstalled Chromium.
 */
export const test = base.extend<{ context: BrowserContext; extensionId: string }>({
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      executablePath: process.env.PW_CHROMIUM_EXECUTABLE || undefined,
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    let [worker] = context.serviceWorkers();
    worker ??= await context.waitForEvent('serviceworker');
    await use(new URL(worker.url()).host);
  },
});

export const expect = test.expect;
