import path from 'node:path';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing/vitest-plugin';

// Test layers (D-233, docs/testing.md):
//   core    — src/core in plain Node: no DOM, no fake browser (the layering guarantee).
//   dom     — everything else in happy-dom with WXT's fake browser.
//   browser — *.browser.test.ts in real Chromium, for layout, popover, canvas and input.
// `pnpm test` runs core + dom; `pnpm test:coverage` runs all three with the thresholds below.

const isolation = { mockReset: true, restoreMocks: true, unstubEnvs: true, unstubGlobals: true };
const browserTests = '**/*.browser.test.{ts,tsx}';
const chromium = process.env.PW_CHROMIUM_EXECUTABLE;
const alias = { '@': path.resolve('src') };

export default defineConfig({
  test: {
    reporters: process.env.CI
      ? ['default', 'github-actions', ['json', { outputFile: 'test-results/vitest.json' }]]
      : ['default', ['json', { outputFile: 'test-results/vitest.json' }]],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        '**/*.test.*',
        // Composition roots: covered by e2e and the wiring test (T-076), not by unit coverage.
        'src/entrypoints/*.ts',
        'src/entrypoints/**/main.tsx',
      ],
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      // REQ-NFR-004: core ≥ 90 % lines / 85 % branches, platform ≥ 85 %, overall ≥ 80 %.
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 80,
        branches: 80,
        'src/core/**': { lines: 90, statements: 90, branches: 85, functions: 90 },
        'src/platform/**': { lines: 85, statements: 85, branches: 80, functions: 85 },
      },
    },
    projects: [
      {
        resolve: { alias },
        test: {
          ...isolation,
          name: 'core',
          environment: 'node',
          include: ['src/core/**/*.test.ts'],
          exclude: [browserTests],
        },
      },
      {
        plugins: [WxtVitest()],
        test: {
          ...isolation,
          name: 'dom',
          environment: 'happy-dom',
          include: ['src/**/*.test.{ts,tsx}', 'tests/unit/**/*.test.{ts,tsx}'],
          exclude: ['src/core/**', browserTests],
          setupFiles: ['tests/unit/setup.ts'],
        },
      },
      {
        // WxtVitest's setup module can't load in browser mode, so only the alias is shared.
        resolve: { alias },
        test: {
          ...isolation,
          name: 'browser',
          include: ['src/**/*.browser.test.{ts,tsx}', 'tests/browser/**/*.browser.test.ts'],
          browser: {
            enabled: true,
            headless: true,
            screenshotFailures: false,
            provider: playwright(chromium ? { launchOptions: { executablePath: chromium } } : {}),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
