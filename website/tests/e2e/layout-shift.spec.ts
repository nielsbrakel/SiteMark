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
      const state: { shift: number; shifts: string[] } = { shift: 0, shifts: [] };
      Object.assign(window, { layoutShift: state });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as PerformanceEntry[] &
          { hadRecentInput: boolean }[]) {
          if (entry.hadRecentInput) continue;
          const { value, sources } = entry as unknown as {
            value: number;
            sources: { node: Element | null; previousRect: DOMRect; currentRect: DOMRect }[];
          };
          state.shift += value;
          const moved = sources.map(
            (s) => `${s.node?.nodeName} ${s.previousRect.height}→${s.currentRect.height}px`,
          );
          state.shifts.push(`${value.toFixed(3)} ${moved.join(', ')}`);
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto(route.path);
    await page.evaluate(() => {
      const ctx = document.createElement('canvas').getContext('2d');
      const w = (f: string) => {
        if (ctx) ctx.font = `20px ${f}`;
        return ctx?.measureText('Permissions and extension settings').width.toFixed(1);
      };
      (window as unknown as { layoutShift: { shifts: string[] } }).layoutShift.shifts.push(
        `DIAG fallback ${w("'Patrick Hand Fallback'")} arial ${w('Arial')} liberation ${w("'Liberation Sans'")} sans ${w('sans-serif')} fallbackLoaded ${document.fonts.check("20px 'Patrick Hand Fallback'")}`,
      );
    });
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);
    const { shift, shifts } = await page.evaluate(
      () => (window as unknown as { layoutShift: { shift: number; shifts: string[] } }).layoutShift,
    );
    expect(shift, shifts.join('\n')).toBeLessThanOrEqual(MAX_SHIFT);
  });
}
