import { readFileSync } from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { expect, routeCases, test } from './fixtures';

// REQ-WEB-007: the JavaScript a page really loads, measured in the browser. A static import graph
// can't tell: the entry imports both languages' catalogs and the playground on demand.

const KB = 1024;
const dist = path.resolve(import.meta.dirname, '../../dist/client');
/** The playground runs the extension's own compose, schemas and marker views (D-254, D-281). */
const PLAYGROUND_PAGES = /^(home|playground) \(/;
const budgetOf = (name: string) => (PLAYGROUND_PAGES.test(name) ? 140 : 80) * KB;

for (const route of routeCases()) {
  test(`${route.name} loads at most its JavaScript budget gzipped @REQ-WEB-007`, async ({
    page,
  }) => {
    const scripts = new Set<string>();
    page.on('response', (response) => {
      const { pathname } = new URL(response.url());
      if (pathname.endsWith('.js')) scripts.add(pathname.replace(/^\/SiteMark\//, ''));
    });
    await page.goto(route.path);
    await page.waitForLoadState('networkidle');
    const sizes = [...scripts].map((file) => gzipSync(readFileSync(path.join(dist, file))).length);
    const total = sizes.reduce((sum, size) => sum + size, 0);
    expect(total, [...scripts].join(', ')).toBeLessThanOrEqual(budgetOf(route.name));
  });
}
