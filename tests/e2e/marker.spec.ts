import { expect, test } from './fixtures';
import { fixtureUrl } from './hosts';
import { waitForMarker } from './marker';
import { aRibbonMark, seedSiteGroup } from './state';

// Sanity check of the helper itself. Marks on real pages need the background wiring (T-076) and
// the renderer (T-081+); their specs use waitForMarker() against the injected marker.
test('waitForMarker pierces an open shadow root and ignores a planted <sitemark-root>', async ({
  page,
}) => {
  await page.goto(fixtureUrl('prod'));
  await page.evaluate(() => {
    const planted = document.createElement('sitemark-root');
    planted.append(document.createElement('div'));
    document.documentElement.append(planted);
    setTimeout(() => {
      const host = document.createElement('sitemark-root');
      const container = document.createElement('div');
      container.setAttribute('data-sitemark-root', '');
      container.textContent = 'marker views';
      host.attachShadow({ mode: 'open' }).append(container);
      document.documentElement.append(host);
    }, 200);
  });
  const root = await waitForMarker(page);
  await expect(root).toHaveText('marker views');
  expect(await root.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(true);
});

test('marks are hidden when printing @REQ-RND-010', async ({ context, extensionId }) => {
  await seedSiteGroup(context, extensionId, {
    patterns: ['*://prod.sitemark.test/*'],
    marks: [aRibbonMark('PROD')],
  });
  const page = await context.newPage();
  await page.goto(fixtureUrl('prod'));
  const ribbon = (await waitForMarker(page)).locator('.sm-ribbon__text');
  await expect(ribbon).toBeVisible();
  await page.emulateMedia({ media: 'print' });
  await expect(ribbon).toBeHidden();
  await page.emulateMedia({ media: 'screen' });
  await expect(ribbon).toBeVisible();
});

test('marks let the pointer through and never move the page @REQ-RND-002', async ({
  context,
  extensionId,
}) => {
  await seedSiteGroup(context, extensionId, {
    patterns: ['*://prod.sitemark.test/*'],
    marks: [
      aRibbonMark('PROD'),
      {
        enabled: true,
        color: '#1f6feb',
        textColor: 'auto',
        target: { kind: 'page' },
        effects: {
          banner: { text: 'Production', edge: 'top', size: 'regular' },
          frame: { widthPx: 6 },
        },
      },
    ],
  });
  const page = await context.newPage();
  await page.goto(fixtureUrl('prod'));
  const rects = () =>
    page.evaluate(() =>
      [...document.querySelectorAll('h1, button, table')].map((el) => {
        const { x, y, width, height } = el.getBoundingClientRect();
        return { x, y, width, height };
      }),
    );
  await waitForMarker(page);
  const marked = await rects();
  await page.evaluate(() => document.querySelector('sitemark-root')?.remove());
  expect(await rects()).toEqual(marked);

  await page.reload();
  await expect((await waitForMarker(page)).locator('.sm-ribbon__text')).toBeVisible();
  await page.evaluate(() => {
    const probe = document.createElement('button');
    probe.id = 'probe';
    probe.textContent = 'Under the ribbon';
    const style = { position: 'fixed', top: '0', right: '0', width: '160px', height: '160px' };
    for (const [name, value] of Object.entries(style)) probe.style.setProperty(name, value);
    probe.addEventListener('click', () => probe.setAttribute('data-clicked', 'yes'));
    document.body.append(probe);
  });
  const width = await page.evaluate(() => innerWidth);
  await page.mouse.click(width - 45, 45);
  await expect(page.locator('#probe')).toHaveAttribute('data-clicked', 'yes');
});

test('user text is inserted as text, never as markup @REQ-RND-011', async ({
  context,
  extensionId,
}) => {
  const text = '<img src=x onerror=alert(1)>';
  await seedSiteGroup(context, extensionId, {
    patterns: ['*://prod.sitemark.test/*'],
    marks: [
      {
        enabled: true,
        color: '#c93a2e',
        textColor: 'auto',
        target: { kind: 'page' },
        effects: { banner: { text, edge: 'bottom', size: 'regular' } },
      },
    ],
  });
  const page = await context.newPage();
  await page.goto(fixtureUrl('prod'));
  const root = await waitForMarker(page);
  await expect(root.locator('.sm-banner__text')).toHaveText(text);
  expect(await root.locator('img').count()).toBe(0);
});

test('only the top frame is marked @REQ-ENV-001', async ({ context, extensionId }) => {
  await seedSiteGroup(context, extensionId, {
    patterns: ['*://prod.sitemark.test/*'],
    marks: [aRibbonMark('PROD')],
  });
  const page = await context.newPage();
  await page.goto(fixtureUrl('prod'));
  await page.evaluate(
    (src) => {
      const frame = document.createElement('iframe');
      frame.src = src;
      frame.name = 'inner';
      document.body.append(frame);
    },
    fixtureUrl('prod', 'scroll.html'),
  );
  await waitForMarker(page);
  const inner = page.frame('inner');
  await expect.poll(() => inner?.evaluate(() => document.readyState)).toBe('complete');
  await page.waitForTimeout(1000);
  expect(await inner?.locator('sitemark-root').count()).toBe(0);
});
