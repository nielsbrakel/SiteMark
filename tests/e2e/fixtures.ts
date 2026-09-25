import path from 'node:path';
import { type BrowserContext, test as base, chromium } from '@playwright/test';

const extensionPath = path.resolve('.output/chrome-mv3');

/**
 * Loads the built Chromium extension into a persistent context.
 * Run `pnpm build` first (`pnpm test:e2e` does this for you).
 * Set PW_CHROMIUM_EXECUTABLE to use a preinstalled Chromium.
 */
export const test = base.extend<{ context: BrowserContext; extensionId: string }>({
  // biome-ignore lint/correctness/noEmptyPattern: Playwright fixtures must destructure their first argument
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      ...(process.env.PW_CHROMIUM_EXECUTABLE && {
        executablePath: process.env.PW_CHROMIUM_EXECUTABLE,
      }),
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
