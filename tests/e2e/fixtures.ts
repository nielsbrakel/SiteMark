import path from 'node:path';
import { type BrowserContext, test as base, chromium, type Worker } from '@playwright/test';

const extensionPath = path.resolve('.output/chrome-mv3-e2e');

/** Hosts a test may reach. Everything else is aborted and fails the test (REQ-PRIV-005). */
const allowedHost = /(^|\.)sitemark\.test$|^127\.0\.0\.1$|^localhost$/;

type Fixtures = {
  context: BrowserContext;
  serviceWorker: Worker;
  extensionId: string;
  /** Requests the network guard aborted. Tests that provoke one must clear it. */
  blockedRequests: string[];
};

/**
 * Loads the e2e build of the Chromium extension into a persistent context.
 * `pnpm test:e2e` builds it first. Set PW_CHROMIUM_EXECUTABLE to use a preinstalled Chromium or
 * Chrome for Testing (branded Chrome ≥ 137 ignores --load-extension and would hang).
 */
export const test = base.extend<Fixtures>({
  // biome-ignore lint/correctness/noEmptyPattern: Playwright fixtures must destructure their first argument
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      ...(process.env.PW_CHROMIUM_EXECUTABLE && {
        executablePath: process.env.PW_CHROMIUM_EXECUTABLE,
      }),
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--host-resolver-rules=MAP *.sitemark.test 127.0.0.1',
      ],
    });
    await use(context);
    await context.close();
  },

  blockedRequests: [
    async ({ context }, use) => {
      const blocked: string[] = [];
      await context.route(/^https?:\/\//, (route) => {
        const url = new URL(route.request().url());
        if (allowedHost.test(url.hostname)) return route.continue();
        blocked.push(url.href);
        return route.abort('blockedbyclient');
      });
      await use(blocked);
      if (blocked.length) {
        throw new Error(`Unexpected network requests (REQ-PRIV-005):\n${blocked.join('\n')}`);
      }
    },
    { auto: true },
  ],

  serviceWorker: async ({ context }, use) => {
    const worker =
      context.serviceWorkers()[0] ??
      (await context.waitForEvent('serviceworker', { timeout: 10_000 }).catch((error: unknown) => {
        throw new Error(
          'The extension service worker did not start within 10 s. Is .output/chrome-mv3-e2e built, ' +
            'and is PW_CHROMIUM_EXECUTABLE a Chromium (not branded Chrome ≥ 137)?',
          { cause: error },
        );
      }));
    await use(worker);
  },

  extensionId: async ({ serviceWorker }, use) => {
    await use(new URL(serviceWorker.url()).host);
  },
});

export const expect = test.expect;
