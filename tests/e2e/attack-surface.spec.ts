import type { Page } from '@playwright/test';
import { sendFromPage } from './background';
import { expect, test } from './fixtures';
import { fixtureUrl } from './hosts';
import { aRibbonMark, seedSiteGroup } from './state';

// Dynamic attack probes (docs/security-scanning.md): a hostile page attacks the running extension
// from the outside, the way a DAST scanner would. Nothing it does may reach the extension.

/** What the extension has stored, read through the background (the only storage owner, D-220). */
async function storedState(page: Page): Promise<unknown> {
  return sendFromPage(page, { type: 'getState' });
}

test('a hostile page cannot reach the extension: no resources, no runtime, no messages @REQ-SEC-003', async ({
  context,
  extensionId,
}) => {
  await seedSiteGroup(context, extensionId, {
    patterns: ['*://prod.sitemark.test/*'],
    marks: [aRibbonMark('PROD')],
  });
  const extensionPage = await context.newPage();
  await extensionPage.goto(`chrome-extension://${extensionId}/popup.html`);
  const before = await storedState(extensionPage);

  const page = await context.newPage();
  await page.goto(fixtureUrl('prod'));
  const probes = await page.evaluate(async (id) => {
    const extensionUrl = `chrome-extension://${id}/manifest.json`;
    // biome-ignore lint/style/noRestrictedGlobals: the probe runs as the hostile page, not as SiteMark
    const fetched = await fetch(extensionUrl).then(
      () => 'reachable',
      () => 'blocked',
    );
    const frame = document.createElement('iframe');
    frame.src = `chrome-extension://${id}/options.html`;
    document.body.append(frame);
    const runtime = (window as unknown as { chrome?: { runtime?: { sendMessage?: unknown } } })
      .chrome?.runtime;
    // Crafted window messages in every shape a confused extension might accept.
    for (const data of [
      { type: 'command', data: { type: 'deleteAllData' } },
      { type: 'applyPlan', plan: { marks: [{ text: '<img src=x onerror=alert(1)>' }] } },
      { type: 'setHidden', hidden: true },
      '{"__proto__":{"polluted":true}}',
    ]) {
      // biome-ignore lint/nursery/noJsRestrictedProperties: the probe runs as the hostile page, not as SiteMark
      window.postMessage(data, '*');
    }
    return { fetched, sendMessage: typeof runtime?.sendMessage };
  }, extensionId);

  expect(probes).toEqual({ fetched: 'blocked', sendMessage: 'undefined' });
  // The mark is still the one the user saved, and nothing was written or injected.
  await page.waitForTimeout(500);
  expect(
    await page.evaluate(() => (({}).constructor.prototype as { polluted?: boolean }).polluted),
  ).toBeUndefined();
  expect(await page.locator('img[src="x"]').count()).toBe(0);
  expect(await storedState(extensionPage)).toEqual(before);
});
