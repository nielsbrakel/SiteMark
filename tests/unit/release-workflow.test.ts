import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

// The release workflow (REQ-SEC-008, REQ-NFR-006, D-227): zips built and checked without secrets,
// provenance and checksums, and store submission only behind the `store` environment.

type Step = {
  uses?: string;
  run?: string;
  with?: Record<string, unknown>;
  env?: Record<string, string>;
};
type Job = {
  needs?: string | string[];
  environment?: string | { name: string };
  permissions?: Record<string, string>;
  steps?: Step[];
};
type Workflow = {
  on: { push?: { tags?: string[]; branches?: string[] } };
  jobs: Record<string, Job>;
};

const FILE = '.github/workflows/release.yml';

function workflow(): Workflow | undefined {
  return existsSync(FILE) ? (parse(readFileSync(FILE, 'utf8')) as Workflow) : undefined;
}

const runs = (job: Job | undefined) => (job?.steps ?? []).map((step) => step.run ?? '').join('\n');
const uses = (job: Job | undefined) => (job?.steps ?? []).map((step) => step.uses ?? '');

describe('REQ-SEC-008 the release workflow', () => {
  it('runs only for pushed v* tags', () => {
    expect(workflow()?.on).toEqual({ push: { tags: ['v*'] } });
  });

  it('builds every store zip without secrets and checks each manifest', () => {
    const zip = workflow()?.jobs.zip;
    expect(JSON.stringify(zip ?? null)).not.toContain('secrets.');
    const script = runs(zip);
    for (const target of ['wxt zip -b chrome', 'wxt zip -b firefox', 'wxt zip -b edge']) {
      expect(script).toContain(target);
    }
    expect(script).toContain('node scripts/check-release-zips.ts');
    expect(script).toContain('vitest run --project build');
  });

  it('runs the build assertions on every store build, Edge included (D-241)', () => {
    const step = workflow()?.jobs.zip?.steps?.find((s) => s.run?.includes('--project build'));
    expect(step?.env?.SITEMARK_TARGETS?.split(',').sort()).toEqual(['chrome', 'edge', 'firefox']);
  });

  it('publishes SHA256SUMS and build-provenance attestations', () => {
    const zip = workflow()?.jobs.zip;
    expect(runs(zip)).toMatch(/sha256sum .*> SHA256SUMS/);
    expect(uses(zip).some((action) => action.startsWith('actions/attest-build-provenance@'))).toBe(
      true,
    );
    expect(zip?.permissions).toEqual({
      contents: 'read',
      'id-token': 'write',
      attestations: 'write',
    });
  });
});

describe('REQ-NFR-006 store submission waits for the owner', () => {
  it('submits with wxt submit only in the store environment, after the zip job', () => {
    const submit = workflow()?.jobs.submit;
    expect(submit?.needs).toEqual(['zip']);
    expect(submit?.environment).toBe('store');
    expect(runs(submit)).toContain('wxt submit');
  });

  it('keeps the store secrets in the submit job only', () => {
    const jobs = Object.entries(workflow()?.jobs ?? {});
    const withSecrets = jobs.filter(([, job]) => JSON.stringify(job).includes('secrets.'));
    expect(withSecrets.map(([name]) => name)).toEqual(['submit']);
  });
});
