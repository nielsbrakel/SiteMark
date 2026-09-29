import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from './fixtures';
import { fixtureUrl } from './hosts';
import { waitForMarker } from './marker';
import { aRibbonMark, seedSiteGroup } from './state';

/** CSP hashes of the fixture's own inline <style> and <script>: the only violations allowed. */
function fixtureInlineHashes(): string[] {
  const html = readFileSync(path.join(import.meta.dirname, 'site/csp.html'), 'utf8');
  return [/<style>([\s\S]*?)<\/style>/, /<script>([\s\S]*?)<\/script>/].map((tag) => {
    const body = html.match(tag)?.[1] ?? '';
    return `sha256-${createHash('sha256').update(body).digest('base64')}`;
  });
}

test('marks render and are styled on a strict-CSP page with Trusted Types @REQ-SEC-007', async ({
  context,
  extensionId,
}) => {
  await seedSiteGroup(context, extensionId, {
    patterns: ['*://prod.sitemark.test/*'],
    marks: [aRibbonMark('PROD')],
  });
  const page = await context.newPage();
  const violations: string[] = [];
  page.on('console', (message) => {
    if (/Content Security Policy|TrustedHTML|Trusted Type/i.test(message.text())) {
      violations.push(message.text());
    }
  });
  await page.goto(fixtureUrl('prod', 'csp.html'));
  const band = (await waitForMarker(page)).locator('.sm-ribbon__band');
  await expect(band).toBeVisible();
  await expect(band).toHaveCSS('background-color', 'rgb(201, 58, 46)');
  await expect(band).toHaveCSS('position', 'absolute');
  // Only the fixture's own inline style and script are refused, never anything of SiteMark's.
  const hashes = fixtureInlineHashes();
  expect(violations).toHaveLength(hashes.length);
  for (const [index, hash] of hashes.entries()) expect(violations[index]).toContain(hash);
});
