// Mutation testing of the pure domain (T-059, REQ-NFR-004, docs/testing.md). Runs nightly
// (.github/workflows/nightly.yml) and locally with `pnpm mutation`; narrow a local run with
// `pnpm mutation --mutate src/core/url/glob.ts`. Below a 60 % mutation score the run fails.

// Options: https://stryker-mutator.io/docs/stryker-js/configuration
export default {
  packageManager: 'pnpm',
  plugins: ['@stryker-mutator/vitest-runner'],
  testRunner: 'vitest',
  // Only the `core` project; `related` runs just the tests that import a mutated file.
  vitest: { configFile: 'vitest.mutation.config.ts', related: true },
  coverageAnalysis: 'perTest',
  mutate: [
    'src/core/**/*.ts',
    '!src/core/**/*.test.ts',
    '!src/core/testing/**',
    // Generated data, not logic.
    '!src/core/url/public-suffixes.ts',
  ],
  thresholds: { high: 80, low: 60, break: 60 },
  // Reuses earlier results for unchanged code and tests; git-ignored, like the reports.
  incremental: true,
  incrementalFile: 'reports/mutation/stryker-incremental.json',
  reporters: ['html', 'json', 'clear-text', 'progress'],
  htmlReporter: { fileName: 'reports/mutation/index.html' },
  jsonReporter: { fileName: 'reports/mutation/mutation.json' },
  clearTextReporter: { allowEmojis: false, reportTests: false },
  tempDirName: '.stryker-tmp',
  cleanTempDir: 'always',
};
