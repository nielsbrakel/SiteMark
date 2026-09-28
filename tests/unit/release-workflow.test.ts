import { existsSync, readdirSync, readFileSync } from 'node:fs';
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
  'timeout-minutes'?: number;
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

  it('publishes SHA256SUMS, with read access only', () => {
    const zip = workflow()?.jobs.zip;
    expect(runs(zip)).toMatch(/sha256sum .*> SHA256SUMS/);
    expect(zip?.permissions).toEqual({ contents: 'read' });
  });

  it('attests the zips in a job of its own that installs and builds nothing', () => {
    const attest = workflow()?.jobs.attest;
    expect(attest?.needs).toEqual(['zip']);
    expect(attest?.permissions).toEqual({ 'id-token': 'write', attestations: 'write' });
    expect(runs(attest)).toBe('');
    const actions = uses(attest).map((action) => action.split('@')[0]);
    expect(actions).toEqual(['actions/download-artifact', 'actions/attest-build-provenance']);
    expect(attest?.steps?.[1]?.with?.['subject-path']).toMatch(/\*\.zip$/);
  });

  it('holds the OIDC token and attestation rights in the attest job only', () => {
    const jobs = Object.entries(workflow()?.jobs ?? {});
    const writers = jobs.filter(([, job]) =>
      Object.values(job.permissions ?? {}).includes('write'),
    );
    expect(writers.map(([name]) => name)).toEqual(['attest']);
  });
});

describe('REQ-NFR-006 store submission waits for the owner', () => {
  /** The publish-browser-extension version the lockfile resolves (what `wxt submit` would run). */
  const publisher = readdirSync('node_modules/.pnpm')
    .find((dir) => dir.startsWith('publish-browser-extension@'))
    ?.split('@')[1];

  it('submits only in the store environment, after the zip and attest jobs', () => {
    const submit = workflow()?.jobs.submit;
    expect(submit?.needs).toEqual(['zip', 'attest']);
    expect(submit?.environment).toBe('store');
    expect(submit?.permissions).toEqual({ contents: 'read', attestations: 'read' });
  });

  it('runs only the pinned publish-browser-extension, not the whole workspace', () => {
    const script = runs(workflow()?.jobs.submit);
    expect(publisher).toMatch(/^\d+\.\d+\.\d+$/);
    expect(script).toContain(`publish-browser-extension@${publisher}`);
    expect(script).not.toMatch(/pnpm install|npm (ci|install)|wxt submit/);
  });

  it('verifies the checksums and the provenance of every zip before it submits', () => {
    const steps = workflow()?.jobs.submit?.steps ?? [];
    const verify = steps.findIndex((step) => step.run?.includes('gh attestation verify'));
    const upload = steps.findIndex((step) => step.run?.includes('publish-browser-extension@'));
    expect(verify).toBeGreaterThanOrEqual(0);
    expect(verify).toBeLessThan(upload);
    expect(steps[verify]?.run).toContain('sha256sum --check SHA256SUMS');
    expect(steps[verify]?.run).toContain('--repo "$GITHUB_REPOSITORY"');
    // biome-ignore lint/suspicious/noTemplateCurlyInString: a GitHub Actions expression, not JS.
    expect(steps[verify]?.env?.GH_TOKEN).toBe('${{ github.token }}');
    expect(JSON.stringify(steps[verify])).not.toContain('secrets.');
  });

  it('keeps the store secrets in the submit job only', () => {
    const jobs = Object.entries(workflow()?.jobs ?? {});
    const withSecrets = jobs.filter(([, job]) => JSON.stringify(job).includes('secrets.'));
    expect(withSecrets.map(([name]) => name)).toEqual(['submit']);
  });
});
