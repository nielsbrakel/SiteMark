import { expect, test } from './fixtures';
import { fixtureUrl } from './hosts';
import { waitForMarker } from './marker';
import { aRibbonMark, seedSiteGroup } from './state';

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
  expect(violations.filter((text) => !text.includes('inline'))).toEqual([]);
});
