import { defineConfig, type TestProjectInlineConfiguration } from 'vitest/config';
import base from './vitest.config';

// Mutation testing (T-059, stryker.config.mjs) runs only the `core` project, exactly as
// vitest.config.ts defines it, without the other projects' environments or the JSON reports.

function isCore(project: unknown): project is TestProjectInlineConfiguration {
  return typeof project === 'object' && project !== null && 'test' in project
    ? (project as TestProjectInlineConfiguration).test?.name === 'core'
    : false;
}

const core = base.test?.projects?.find(isCore);
if (!core) throw new Error('vitest.config.ts has no core project');

export default defineConfig({ test: { projects: [core] } });
