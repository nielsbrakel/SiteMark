export type Outcome = { passed: number; failed: number; unexpected: string[] };

/** A red test may only fail because an expectation failed or a stub isn't implemented yet. */
const EXPECTED_FAILURE = /^(AssertionError|NotImplementedError)\b|^Error: expect\(/;

type VitestReport = {
  testResults?: {
    status?: string;
    message?: string;
    assertionResults?: { status?: string; failureMessages?: string[] }[];
  }[];
};

type PlaywrightSuite = {
  specs?: {
    ok?: boolean;
    tests?: { results?: { status?: string; error?: { message?: string } }[] }[];
  }[];
  suites?: PlaywrightSuite[];
};

// biome-ignore lint/suspicious/noControlCharactersInRegex: matches terminal color codes (ESC [ … m)
const ANSI_COLOR = /\u001b\[[0-9;]*m/g;

/** The first line, without terminal colors (Playwright keeps them in its JSON report). */
const firstLine = (message: string) => message.replace(ANSI_COLOR, '').split('\n')[0] ?? '';

type VitestFile = NonNullable<VitestReport['testResults']>[number];

function fileOutcome(file: VitestFile): Outcome {
  const tests = file.assertionResults ?? [];
  const failed = tests.filter((test) => test.status === 'failed');
  const messages = failed.map((test) => firstLine(test.failureMessages?.[0] ?? ''));
  // A file that fails without failing tests couldn't load (syntax, import or setup error).
  const couldNotRun = (file.status === 'failed' || Boolean(file.message)) && !failed.length;
  return {
    passed: tests.filter((test) => test.status === 'passed').length,
    failed: failed.length,
    unexpected: [
      ...(couldNotRun ? [firstLine(file.message ?? 'test file failed to run')] : []),
      ...messages.filter((message) => !EXPECTED_FAILURE.test(message)),
    ],
  };
}

export function vitestOutcome(report: unknown): Outcome {
  return ((report as VitestReport).testResults ?? []).map(fileOutcome).reduce(
    (total, next) => ({
      passed: total.passed + next.passed,
      failed: total.failed + next.failed,
      unexpected: [...total.unexpected, ...next.unexpected],
    }),
    { passed: 0, failed: 0, unexpected: [] as string[] },
  );
}

function collect(suite: PlaywrightSuite, outcome: Outcome): void {
  for (const spec of suite.specs ?? []) {
    if (spec.ok) {
      outcome.passed++;
      continue;
    }
    outcome.failed++;
    const results = spec.tests?.flatMap((test) => test.results ?? []) ?? [];
    const message = firstLine(results.find((r) => r.error)?.error?.message ?? 'failed');
    if (!EXPECTED_FAILURE.test(message)) outcome.unexpected.push(message);
  }
  for (const child of suite.suites ?? []) collect(child, outcome);
}

export function playwrightOutcome(report: unknown): Outcome {
  const outcome: Outcome = { passed: 0, failed: 0, unexpected: [] };
  for (const suite of (report as { suites?: PlaywrightSuite[] }).suites ?? []) {
    collect(suite, outcome);
  }
  return outcome;
}
