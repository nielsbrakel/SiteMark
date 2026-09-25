import { appendFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { outDir, targets } from './targets';

/** Gzipped budgets for code injected into web pages (REQ-NFR-002). The picker joins in T-111. */
const budgets = [{ name: 'marker', file: 'content-scripts/content.js', limitKb: 25 }];

const gzipKb = (file: string) => gzipSync(readFileSync(file), { level: 9 }).length / 1024;

describe.each(targets())('%s content scripts', (target) => {
  describe('REQ-NFR-002 stay within their gzip size budget', () => {
    const rows = budgets.map((budget) => ({
      ...budget,
      kb: gzipKb(path.join(outDir(target), budget.file)),
    }));

    it.each(rows)('$name ≤ $limitKb KB gzip', ({ kb, limitKb }) => {
      expect(kb).toBeLessThanOrEqual(limitKb);
    });

    // Shows the sizes on the CI run page.
    if (process.env.GITHUB_STEP_SUMMARY) {
      const table = rows.map(
        (r) => `| ${target} | ${r.name} | ${r.kb.toFixed(2)} KB | ${r.limitKb} KB |`,
      );
      appendFileSync(
        process.env.GITHUB_STEP_SUMMARY,
        ['| Target | Script | Gzip | Budget |', '| --- | --- | --- | --- |', ...table, ''].join(
          '\n',
        ),
      );
    }
  });
});
