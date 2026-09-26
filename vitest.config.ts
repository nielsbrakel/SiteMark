import path from 'node:path';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing/vitest-plugin';

// Test layers (D-233, docs/testing.md):
//   core    — src/core in plain Node: no DOM, no fake browser (the layering guarantee).
//   dom     — everything else in happy-dom with WXT's fake browser.
//   browser — *.browser.test.ts in real Chromium, for layout, popover, canvas and input.
//   build   — tests/build on the production output of every target (`pnpm test:build`).
//   website-node / website-dom — the website (docs/website/plan.md §7): pure modules in Node, components
//             in happy-dom without the extension's fake browser (the website never touches browser.*).
//   website-build — website/tests/build on the built website (`pnpm web:test:build`).
// `pnpm test` runs core + dom; `pnpm test:coverage` runs core, dom and browser with the thresholds below.

const isolation = { mockReset: true, restoreMocks: true, unstubEnvs: true, unstubGlobals: true };
const browserTests = '**/*.browser.test.{ts,tsx}';
const chromium = process.env.PW_CHROMIUM_EXECUTABLE;
const alias = { '@': path.resolve('src') };
// D-226: tests pierce shadow roots, like the e2e build. Projects don't inherit the root `define`,
// and browser mode ignores it (tests/browser/setup.ts sets the global there instead).
const define = { __SHADOW_MODE__: JSON.stringify('open') };

/** `vitest run --project core --project dom` → "core-dom" (+ "-chrome" per build target); a bare run → "all". */
function reportName(): string {
  const projects = process.argv.flatMap((arg, i, all) =>
    arg === '--project' ? [all[i + 1]] : arg.startsWith('--project=') ? [arg.slice(10)] : [],
  );
  const name = projects.length ? projects.join('-') : 'all';
  const targets = process.env.SITEMARK_TARGETS?.replaceAll(',', '-');
  return targets ? `${name}-${targets}` : name;
}

export default defineConfig({
  test: {
    // One JSON report per run (named after its projects), merged by `pnpm progress --coverage`.
    reporters: [
      'default',
      ...(process.env.CI ? ['github-actions'] : []),
      ['json', { outputFile: `test-results/vitest-${reportName()}.json` }],
    ],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}', 'website/src/**/*.{ts,tsx}'],
      exclude: [
        '**/*.test.*',
        // Composition roots: covered by e2e and the wiring test (T-076), not by unit coverage.
        'src/entrypoints/*.ts',
        'src/entrypoints/**/main.tsx',
        'website/src/entry-client.{ts,tsx}',
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
        // Repo tooling (progress, verify-tdd) in plain Node.
        test: {
          ...isolation,
          name: 'scripts',
          environment: 'node',
          include: ['scripts/**/*.test.ts'],
        },
      },
      {
        plugins: [WxtVitest()],
        define,
        test: {
          ...isolation,
          name: 'dom',
          environment: 'happy-dom',
          include: ['src/**/*.test.{ts,tsx}', 'tests/{unit,fakes}/**/*.test.{ts,tsx}'],
          exclude: ['src/core/**', browserTests],
          setupFiles: ['tests/unit/setup.ts'],
        },
      },
      {
        // Assertions on the real production builds in .output (`pnpm test:build` builds them first).
        test: {
          ...isolation,
          name: 'build',
          environment: 'node',
          include: ['tests/build/**/*.test.ts'],
        },
      },
      {
        resolve: { alias },
        test: {
          ...isolation,
          name: 'website-node',
          environment: 'node',
          include: ['website/{src,scripts}/**/*.test.ts', 'website/tests/unit/**/*.test.ts'],
          exclude: [browserTests],
        },
      },
      {
        resolve: { alias },
        test: {
          ...isolation,
          name: 'website-dom',
          environment: 'happy-dom',
          include: ['website/src/**/*.test.tsx'],
          exclude: [browserTests],
        },
      },
      {
        // Assertions on the built website in website/dist (`pnpm web:test:build` builds it first).
        test: {
          ...isolation,
          name: 'website-build',
          environment: 'node',
          include: ['website/tests/build/**/*.test.ts'],
        },
      },
      {
        // WxtVitest's setup module can't load in browser mode, so only the alias is shared.
        resolve: { alias, dedupe: ['react', 'react-dom'] },
        // Pre-bundled up front: discovering a dependency mid-run makes Vite reload the page, and a
        // second React copy breaks hooks.
        optimizeDeps: {
          include: [
            'wxt/browser',
            'react',
            'react/jsx-dev-runtime',
            'react/jsx-runtime',
            'react-dom',
            'react-dom/client',
            '@testing-library/react',
          ],
        },
        test: {
          ...isolation,
          name: 'browser',
          setupFiles: ['tests/browser/setup.ts'],
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
