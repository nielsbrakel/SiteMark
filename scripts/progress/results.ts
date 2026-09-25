export type Reports = { vitest?: unknown; playwright?: unknown };

type VitestReport = {
  testResults?: { assertionResults?: { fullName?: string; status?: string }[] }[];
};
type PlaywrightSpec = { title: string; tags?: string[]; ok?: boolean };
type PlaywrightSuite = { title: string; specs?: PlaywrightSpec[]; suites?: PlaywrightSuite[] };

function vitestTitles(report: VitestReport): string[] {
  return (report.testResults ?? []).flatMap((file) =>
    (file.assertionResults ?? [])
      .filter((test) => test.status === 'passed' && test.fullName)
      .map((test) => test.fullName ?? ''),
  );
}

function playwrightTitles(suite: PlaywrightSuite, parents: string[] = []): string[] {
  const path = [...parents, suite.title].filter(Boolean);
  const own = (suite.specs ?? [])
    .filter((spec) => spec.ok)
    .map((spec) => [...path, spec.title, ...(spec.tags ?? [])].join(' '));
  return [...own, ...(suite.suites ?? []).flatMap((child) => playwrightTitles(child, path))];
}

/** Full titles of passing tests (D-210: only a passing test that names a REQ covers it). */
export function passingTitles(reports: Reports): string[] {
  const vitest = reports.vitest ? vitestTitles(reports.vitest as VitestReport) : [];
  const suites = (reports.playwright as { suites?: PlaywrightSuite[] } | undefined)?.suites ?? [];
  return [...vitest, ...suites.flatMap((suite) => playwrightTitles(suite))];
}

export function coveredRequirements(titles: string[]): Set<string> {
  return new Set(titles.flatMap((title) => title.match(/REQ-[A-Z0-9]+-\d{3}/g) ?? []));
}
