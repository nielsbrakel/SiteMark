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
  'timeout-minutes'?: number;
  environment?: string | { name: string };
  strategy?: { matrix?: { include?: { store: string; os: string }[] } };
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

  it('refuses a tag that is not the package.json version or a commit without a green ci-ok', () => {
    const guard = workflow()?.jobs.guard;
    expect(workflow()?.jobs.zip?.needs).toEqual(['guard']);
    expect(guard?.permissions).toEqual({ contents: 'read', checks: 'read' });
    expect(runs(guard)).toContain("require('./package.json').version");
    expect(runs(guard)).toContain('check_name=ci-ok');
  });

  it('builds every store zip without secrets and checks each manifest', () => {
    const zip = workflow()?.jobs.zip;
    expect(JSON.stringify(zip ?? null)).not.toContain('secrets.');
    const script = runs(zip);
    for (const target of [
      'wxt zip -b chrome',
      'wxt zip -b firefox',
      'wxt zip -b edge',
      'wxt zip -b safari',
    ]) {
      expect(script).toContain(target);
    }
    expect(script).toContain('node scripts/check-release-zips.ts');
    expect(script).toContain('vitest run --project build');
  });

  it('runs the build assertions on every store build, Edge included (D-241)', () => {
    const step = workflow()?.jobs.zip?.steps?.find((s) => s.run?.includes('--project build'));
    expect(step?.env?.SITEMARK_TARGETS?.split(',').sort()).toEqual([
      'chrome',
      'edge',
      'firefox',
      'safari',
    ]);
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
    expect(attest?.steps?.filter((step) => step.run)).toEqual([]);
    const actions = uses(attest).map((action) => action.split('@')[0]);
    expect(actions).toEqual(['actions/download-artifact', 'actions/attest-build-provenance']);
    expect(attest?.steps?.[1]?.with?.['subject-path']).toMatch(/\*\.zip$/);
  });

  it('holds the OIDC token and attestation rights in the attest job only', () => {
    const jobs = Object.entries(workflow()?.jobs ?? {});
    const writers = jobs.filter(([, job]) =>
      Object.values(job.permissions ?? {}).includes('write'),
    );
    expect(writers.map(([name]) => name)).toEqual(['attest', 'release']);
    expect(workflow()?.jobs.attest?.permissions).toEqual({
      'id-token': 'write',
      attestations: 'write',
    });
  });

  it('publishes a GitHub Release of the attested zips, without secrets or project code', () => {
    const release = workflow()?.jobs.release;
    expect(release?.needs).toEqual(['attest']);
    expect(release?.permissions).toEqual({ contents: 'write' });
    expect(JSON.stringify(release ?? null)).not.toContain('secrets.');
    expect(uses(release).filter(Boolean)).toHaveLength(1);
    expect(runs(release)).toContain('gh release create');
  });
});

describe('REQ-NFR-006 store submission waits for the owner', () => {
  it('submits only in the store environment, after the zip and attest jobs', () => {
    const submit = workflow()?.jobs.submit;
    expect(submit?.needs).toEqual(['zip', 'attest']);
    expect(submit?.environment).toBe('store');
    expect(submit?.permissions).toEqual({ contents: 'read', attestations: 'read' });
  });

  it('runs only the uploader that tools/uploader locks, not the whole workspace', () => {
    const script = runs(workflow()?.jobs.submit);
    expect(script).toContain('pnpm install --frozen-lockfile --ignore-workspace --ignore-scripts');
    expect(script).toContain('pnpm exec publish-extension');
    expect(script).not.toMatch(/\bnpx\b|\bnpm (ci|install)|wxt submit/);
  });

  it('locks the same publish-browser-extension version that wxt resolves', () => {
    const version = (name: string) =>
      readFileSync(name, 'utf8').match(/^ {2}publish-browser-extension@([\d.]+):/m)?.[1];
    expect(version('tools/uploader/pnpm-lock.yaml')).toMatch(/^\d+\.\d+\.\d+$/);
    expect(version('tools/uploader/pnpm-lock.yaml')).toBe(version('pnpm-lock.yaml'));
  });

  it('verifies the checksums and the provenance of every zip before it submits', () => {
    const steps = workflow()?.jobs.submit?.steps ?? [];
    const verify = steps.findIndex((step) => step.run?.includes('gh attestation verify'));
    const upload = steps.findIndex((step) => step.run?.includes('pnpm exec publish-extension'));
    expect(verify).toBeGreaterThanOrEqual(0);
    expect(verify).toBeLessThan(upload);
    expect(steps[verify]?.run).toContain('sha256sum --check SHA256SUMS');
    expect(steps[verify]?.run).toContain('--repo "$GITHUB_REPOSITORY"');
    // biome-ignore lint/suspicious/noTemplateCurlyInString: a GitHub Actions expression, not JS.
    expect(steps[verify]?.env?.GH_TOKEN).toBe('${{ github.token }}');
    expect(JSON.stringify(steps[verify])).not.toContain('secrets.');
  });

  it('submits every store in a job of its own, Safari from macOS after verifying the zip', () => {
    const submit = workflow()?.jobs.submit;
    const stores = submit?.strategy?.matrix?.include ?? [];
    expect(stores.map((entry) => entry.store)).toEqual(['chrome', 'firefox', 'edge', 'safari']);
    expect(stores.find((entry) => entry.store === 'safari')?.os).toBe('macos-15');
    const script = runs(submit);
    expect(script.indexOf('gh attestation verify')).toBeLessThan(script.indexOf('xcodebuild'));
  });

  it('keeps the store secrets in the submit job only', () => {
    const jobs = Object.entries(workflow()?.jobs ?? {});
    const withSecrets = jobs.filter(([, job]) => JSON.stringify(job).includes('secrets.'));
    expect(withSecrets.map(([name]) => name)).toEqual(['submit']);
  });
});
