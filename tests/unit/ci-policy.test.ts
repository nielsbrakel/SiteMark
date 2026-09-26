import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import playwright from '../../node_modules/@playwright/test/package.json';
import pkg from '../../package.json';

// Supply-chain and CI policy (REQ-SEC-009, D-238), checked on every run so a workflow edit or a
// Dependabot bump can't quietly undo it. zizmor and actionlint cover the rest in CI.

type Step = { uses?: string; run?: string; with?: Record<string, unknown> };
type Job = {
  'timeout-minutes'?: number;
  permissions?: unknown;
  needs?: string[];
  container?: { image: string };
  steps?: Step[];
};
type Workflow = {
  on?: { schedule?: { cron: string }[] };
  permissions?: unknown;
  jobs: Record<string, Job>;
};

const yamlIn = (dir: string) =>
  readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((file) => /\.ya?ml$/.test(file))
    .map((file) => path.join(dir, file));
const load = <T>(file: string) => parse(readFileSync(file, 'utf8')) as T;

const workflows = yamlIn('.github/workflows').map((file) => ({ file, wf: load<Workflow>(file) }));
const actionFiles = (() => {
  try {
    return yamlIn('.github/actions');
  } catch {
    return [];
  }
})();
const allSteps = [
  ...workflows.flatMap(({ file, wf }) =>
    Object.values(wf.jobs).flatMap((job) => (job.steps ?? []).map((step) => ({ file, step }))),
  ),
  ...actionFiles.flatMap((file) =>
    (load<{ runs: { steps?: Step[] } }>(file).runs.steps ?? []).map((step) => ({ file, step })),
  ),
];
const jobs = workflows.flatMap(({ file, wf }) =>
  Object.entries(wf.jobs).map(([name, job]) => ({ id: `${file}#${name}`, job })),
);

const pinned = /^[\w.-]+\/[\w./-]+@[0-9a-f]{40}$|^docker:\/\/[^@]+@sha256:[0-9a-f]{64}$|^\.\//;

describe('REQ-SEC-009 GitHub Actions are pinned and least-privilege', () => {
  it('pins every action by commit SHA and every image by digest', () => {
    const unpinned = allSteps.filter(({ step }) => step.uses && !pinned.test(step.uses));
    expect(unpinned.map(({ file, step }) => `${file}: ${step.uses}`)).toEqual([]);
  });

  it('checks out without persisting credentials', () => {
    const leaky = allSteps.filter(
      ({ step }) =>
        step.uses?.startsWith('actions/checkout@') && step.with?.['persist-credentials'] !== false,
    );
    expect(leaky.map(({ file }) => file)).toEqual([]);
  });

  it('grants no permissions at the workflow level', () => {
    for (const { file, wf } of workflows) expect(wf.permissions, file).toEqual({});
  });

  it('gives every job its own permissions and a timeout', () => {
    const missing = jobs.filter(({ job }) => !job.permissions || !job['timeout-minutes']);
    expect(missing.map(({ id }) => id)).toEqual([]);
  });

  it('gates merges on ci-ok, which needs every other CI job', () => {
    const ci = load<Workflow>('.github/workflows/ci.yml');
    const others = Object.keys(ci.jobs).filter((name) => name !== 'ci-ok');
    expect([...(ci.jobs['ci-ok']?.needs ?? [])].sort()).toEqual(others.sort());
  });

  it('runs browsers in the Playwright image that matches @playwright/test', () => {
    const images = jobs.flatMap(({ job }) => (job.container ? [job.container.image] : []));
    expect(images.length).toBeGreaterThan(0);
    for (const image of images) expect(image).toContain(`playwright:v${playwright.version}-`);
  });
});

describe('REQ-SEC-009 dependencies are frozen, pinned and cooled down', () => {
  it('pins Node exactly and satisfies the engines range', () => {
    const nvmrc = readFileSync('.nvmrc', 'utf8').trim();
    expect(nvmrc).toMatch(/^\d+\.\d+\.\d+$/);
    expect(pkg.engines.node).toMatch(/^\^22\./);
    expect(pkg.packageManager).toMatch(/^pnpm@\d+\.\d+\.\d+$/);
  });

  it('pins the toolchain that must be bumped on purpose', () => {
    const dev = pkg.devDependencies as Record<string, string>;
    for (const name of ['@biomejs/biome', 'web-ext'])
      expect(dev[name] ?? 'missing', name).toMatch(/^\d/);
  });

  it('blocks unreviewed dependency build scripts', () => {
    expect(existsSync('pnpm-workspace.yaml')).toBe(true);
    const ws = load<Record<string, unknown>>('pnpm-workspace.yaml');
    expect(ws.strictDepBuilds).toBe(true);
    expect(ws.onlyBuiltDependencies).toEqual([]);
  });

  it('gives every Dependabot ecosystem a cooldown', () => {
    const config = load<{ updates: { 'package-ecosystem': string; cooldown?: unknown }[] }>(
      '.github/dependabot.yml',
    );
    for (const update of config.updates) {
      expect(update.cooldown, update['package-ecosystem']).toBeDefined();
    }
  });
});

describe('REQ-NFR-004 mutation testing guards core every night', () => {
  it('runs `pnpm mutation` on a schedule and keeps the HTML report', () => {
    const nightly = load<Workflow>('.github/workflows/nightly.yml');
    expect(nightly.on?.schedule?.length).toBeGreaterThan(0);
    const steps = Object.values(nightly.jobs).flatMap((job) => job.steps ?? []);
    expect(steps.map((step) => step.run)).toContain('pnpm mutation');
    const upload = steps.find((step) => step.uses?.startsWith('actions/upload-artifact@'));
    expect(upload?.with?.path).toBe('reports/mutation/');
  });

  it('mutates src/core and fails below a 60 % mutation score', async () => {
    const href = pathToFileURL(path.resolve('stryker.config.mjs')).href;
    const config = (await import(href)).default as {
      mutate: string[];
      thresholds: { break: number };
    };
    expect(config.mutate).toContain('src/core/**/*.ts');
    expect(config.thresholds.break).toBeGreaterThanOrEqual(60);
  });
});

describe('REQ-WEB-008 pages.yml deploys the website from main only (D-252)', () => {
  type PagesJob = Job & { environment?: { name: string } };
  type Pages = {
    on: { push?: { branches?: string[]; paths?: string[] }; workflow_dispatch?: unknown };
    concurrency: { group: string; 'cancel-in-progress': boolean };
    jobs: Record<string, PagesJob>;
  };
  const pages = load<Pages>('.github/workflows/pages.yml');

  it('runs on pushes to main that touch the website or its inputs, and on dispatch', () => {
    expect(Object.keys(pages.on).sort()).toEqual(['push', 'workflow_dispatch']);
    expect(pages.on.push?.branches).toEqual(['main']);
    for (const input of ['website/**', 'src/core/**', 'public/_locales/**', 'PRIVACY*.md']) {
      expect(pages.on.push?.paths).toContain(input);
    }
  });

  it('builds with read access only and deploys in the github-pages environment', () => {
    expect(pages.jobs.build?.permissions).toEqual({ contents: 'read' });
    expect(pages.jobs.deploy?.permissions).toEqual({ pages: 'write', 'id-token': 'write' });
    expect(pages.jobs.deploy?.environment?.name).toBe('github-pages');
    expect(pages.jobs.deploy?.needs).toBe('build');
  });

  it('never cancels a deploy in progress', () => {
    expect(pages.concurrency).toEqual({ group: 'pages', 'cancel-in-progress': false });
  });
});

describe('REQ-WEB-009 the website jobs are part of ci-ok', () => {
  it('builds the website, checks its output and runs its e2e on every pull request', () => {
    const ci = load<Workflow>('.github/workflows/ci.yml');
    const runs = (ci.jobs.website?.steps ?? []).map((step) => step.run);
    expect(runs).toContain('pnpm web:test:build');
    expect(runs).toContain('pnpm exec playwright test --config website/playwright.config.ts');
    expect(ci.jobs['ci-ok']?.needs).toContain('website');
    expect(ci.jobs.traceability?.needs).toContain('website');
  });
});
