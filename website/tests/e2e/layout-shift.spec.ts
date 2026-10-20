import { expect, routeCases, test } from './fixtures';

// REQ-WEB-007: the text doesn't jump when the handwriting fonts arrive. A slow connection makes the
// fonts late, which is what shifted the header and the lists before the fonts were preloaded and the
// fallback faces were scaled to match (src/styles/fonts.css).

/** Core Web Vitals call a shift score above 0.1 "needs improvement". */
const MAX_SHIFT = 0.1;

for (const route of routeCases()) {
  test(`${route.name} stays still while the fonts load on a slow connection @REQ-WEB-007`, async ({
    page,
  }) => {
    const client = await page.context().newCDPSession(page);
    await client.send('Network.enable');
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 150,
      downloadThroughput: 200 * 1024,
      uploadThroughput: 100 * 1024,
    });
    await page.addInitScript(() => {
      const state = { shift: 0 };
      Object.assign(window, { layoutShift: state });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as PerformanceEntry[] &
          { hadRecentInput: boolean }[]) {
          if (!entry.hadRecentInput) state.shift += (entry as unknown as { value: number }).value;
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto(route.path);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);
    const shift = await page.evaluate(
      () => (window as unknown as { layoutShift: { shift: number } }).layoutShift.shift,
    );
    expect(shift).toBeLessThanOrEqual(MAX_SHIFT);
  });
}
