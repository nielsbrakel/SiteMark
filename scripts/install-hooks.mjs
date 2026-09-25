// Installs the lefthook git hooks on `pnpm install` (the `prepare` script). Skipped in CI and outside
// a git checkout, e.g. when AMO reviewers build from the source zip (SOURCE_REVIEW.md).
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

if (process.env.CI || !existsSync('.git')) {
  console.log('install-hooks: skipped (CI or no .git)');
} else {
  execFileSync('pnpm', ['exec', 'lefthook', 'install'], { stdio: 'inherit' });
}
