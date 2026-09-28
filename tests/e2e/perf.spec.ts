import type { CDPSession, Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { fixtureUrl } from './hosts';
import { waitForMarker } from './marker';
import { aRibbonMark, type MarkSeed, seedSiteGroup } from './state';

// Performance probes (REQ-NFR-003). Timing depends on the machine, so they are tagged @perf and
// run in the nightly workflow (PERF=1, playwright.config.ts) instead of gating pull requests.
test.use({ trace: 'off', screenshot: 'off' });

type Profile = {
  nodes: { id: number; callFrame: { url: string } }[];
  samples: number[];
  timeDeltas: number[];
};

/** CPU time (ms) that `load` spends in scripts whose URL ends with `file`, from a CPU profile. */
async function selfTimeIn(page: Page, file: string, load: () => Promise<void>): Promise<number> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.setSamplingInterval', { interval: 20 });
  await cdp.send('Profiler.start');
  await load();
  const { profile } = (await cdp.send('Profiler.stop')) as { profile: Profile };
  const inFile = new Set(
    profile.nodes.filter((node) => node.callFrame.url.endsWith(file)).map((node) => node.id),
  );
  const micros = profile.samples.reduce(
    (sum, id, i) => (inFile.has(id) ? sum + (profile.timeDeltas[i] ?? 0) : sum),
    0,
  );
  return micros / 1000;
}

/** JavaScript time spent by everything in the page (its isolated worlds too), in ms. */
async function scriptMs(cdp: CDPSession): Promise<number> {
  const { metrics } = (await cdp.send('Performance.getMetrics')) as {
    metrics: { name: string; value: number }[];
  };
  return (metrics.find((metric) => metric.name === 'ScriptDuration')?.value ?? 0) * 1000;
}

const outline = (selector: string): MarkSeed => ({
  enabled: true,
  color: '#c93a2e',
  textColor: 'auto',
  target: { kind: 'element', selector },
  effects: { outline: { widthPx: 2, style: 'solid', pulse: false } },
});

test('with no active group the marker finishes in < 2 ms @perf @REQ-NFR-003', async ({
  context,
  extensionId,
}) => {
  // Registered for test.sitemark.test, but no pattern matches the page: the marker stays idle.
  await seedSiteGroup(context, extensionId, {
    patterns: ['*://test.sitemark.test/never/*'],
    marks: [aRibbonMark('TEST')],
  });
  const page = await context.newPage();
  const ms = await selfTimeIn(page, '/marker.js', async () => {
    await page.goto(fixtureUrl('test'));
    await page.waitForTimeout(1000);
  });
  console.log(`idle marker: ${ms.toFixed(2)} ms of script`);
  expect(ms).toBeLessThan(2);
});

test('marks are visible ≤ 100 ms after DOMContentLoaded @perf @REQ-NFR-003', async ({
  context,
  extensionId,
}) => {
  await seedSiteGroup(context, extensionId, {
    patterns: ['*://prod.sitemark.test/*'],
    marks: [aRibbonMark('PROD')],
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    const times = { ready: 0, marked: 0 };
    Object.assign(window, { markerTimes: times });
    document.addEventListener('DOMContentLoaded', () => {
      times.ready = performance.now();
    });
    new MutationObserver(() => {
      if (!times.marked && document.querySelector('sitemark-root'))
        times.marked = performance.now();
    }).observe(document, { childList: true, subtree: true });
  });
  await page.goto(fixtureUrl('prod'));
  await waitForMarker(page);
  const { ready, marked } = await page.evaluate(
    () => (window as unknown as { markerTimes: { ready: number; marked: number } }).markerTimes,
  );
  console.log(`marks after DOMContentLoaded: ${(marked - ready).toFixed(1)} ms`);
  expect(marked - ready).toBeLessThanOrEqual(100);
});

test('with 10 element marks, scrolling costs < 1 ms per frame @perf @REQ-NFR-003', async ({
  context,
  extensionId,
}) => {
  const selectors = [
    'h1',
    'h2',
    '#new-customer',
    '#export',
    '#delete',
    'table',
    'thead',
    'tbody',
    'nav',
    'main',
  ];
  await seedSiteGroup(context, extensionId, {
    patterns: ['*://prod.sitemark.test/*'],
    marks: selectors.map(outline),
  });
  const page = await context.newPage();
  await page.goto(fixtureUrl('prod'));
  const root = await waitForMarker(page);
  await expect(root.locator('.sm-outline')).toHaveCount(10);
  await page.evaluate(() => document.body.style.setProperty('min-height', '5000px'));
  const cdp = await context.newCDPSession(page);
  await cdp.send('Performance.enable');
  const before = await scriptMs(cdp);
  const frames = 120;
  for (let frame = 0; frame < frames; frame++) {
    await page.mouse.wheel(0, 30);
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
  }
  // The page evaluations above cost a little script time of their own: the budget includes them.
  const perFrame = ((await scriptMs(cdp)) - before) / frames;
  console.log(`scrolling with 10 element marks: ${perFrame.toFixed(3)} ms of script per frame`);
  expect(perFrame).toBeLessThan(1);
});
