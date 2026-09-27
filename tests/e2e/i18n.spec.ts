import type { BrowserContext, Page, Worker } from '@playwright/test';
import { expect, test } from './fixtures';
import { fixtureUrl } from './hosts';
import { openPopupFor } from './popup-page';
import { aRibbonMark, seedSiteGroup } from './state';

// The popup is 360 px wide (REQ-I18N-004): Dutch and a pseudo-locale with 40 % longer words must fit.

const POPUP_WIDTH = 360;

/** Elements that stick out of the popup's width or cut off their own text horizontally. */
function overflowing(popup: Page): Promise<string[]> {
  return popup.evaluate((width) => {
    const describe = (el: Element) =>
      `${el.tagName.toLowerCase()}: ${el.textContent?.trim().slice(0, 40)}`;
    return [...document.body.querySelectorAll('*')]
      .filter((el) => {
        const box = el.getBoundingClientRect();
        if (box.width === 0) return false;
        const clipped = el instanceof HTMLElement && el.scrollWidth > el.clientWidth + 1;
        const style = getComputedStyle(el);
        return box.right > width + 0.5 || (clipped && style.overflowX !== 'visible');
      })
      .map(describe);
  }, POPUP_WIDTH);
}

/** Popups for a matched page (a group with a page and an element mark) and an unmatched one. */
async function seededPopups(
  context: BrowserContext,
  extensionId: string,
  worker: Worker,
): Promise<{ matched: Page; unmatched: Page }> {
  await seedSiteGroup(context, extensionId, {
    name: 'Productie omgeving van de klantportal',
    patterns: ['*://prod.sitemark.test/*'],
    marks: [
      aRibbonMark('PROD'),
      {
        enabled: true,
        color: '#1f6feb',
        textColor: 'auto',
        label: 'Knop verwijderen klant',
        target: { kind: 'element', selector: '#delete' },
        effects: { outline: { widthPx: 2, style: 'solid', pulse: false } },
      },
    ],
  });
  const matched = await openPopupFor(context, worker, extensionId, fixtureUrl('prod'));
  const unmatched = await openPopupFor(context, worker, extensionId, fixtureUrl('test'));
  return { matched: matched.popup, unmatched: unmatched.popup };
}

test.describe('Dutch UI', () => {
  test.use({ uiLanguage: 'nl' });

  test('the popup is in Dutch, with lang="nl", and fits in 360 px @REQ-I18N-001 @REQ-I18N-004', async ({
    context,
    extensionId,
    serviceWorker,
  }) => {
    const { matched, unmatched } = await seededPopups(context, extensionId, serviceWorker);
    for (const popup of [matched, unmatched]) {
      await popup.setViewportSize({ width: POPUP_WIDTH, height: 600 });
      await expect(popup.locator('html')).toHaveAttribute('lang', /^nl/);
      await expect(popup.getByRole('button', { name: /^Element kiezen/ })).toBeVisible();
      expect(await overflowing(popup)).toEqual([]);
    }
    await expect(
      unmatched?.getByRole('button', { name: 'Deze site markeren' }) ?? matched.locator('x'),
    ).toBeVisible();
  });
});

test('a pseudo-locale with 40 % longer words still fits the 360 px popup @REQ-I18N-004', async ({
  context,
  extensionId,
  serviceWorker,
}) => {
  await context.addInitScript(() => {
    const i18n = (
      globalThis as unknown as { chrome?: { i18n?: { getMessage: (...a: unknown[]) => string } } }
    ).chrome?.i18n;
    if (!i18n) return;
    const original = i18n.getMessage.bind(i18n);
    i18n.getMessage = (...args: unknown[]) =>
      original(...args).replace(
        /\p{L}+/gu,
        (word) => word + '~'.repeat(Math.ceil(word.length * 0.4)),
      );
  });
  const { matched, unmatched } = await seededPopups(context, extensionId, serviceWorker);
  for (const popup of [matched, unmatched]) {
    await popup.setViewportSize({ width: POPUP_WIDTH, height: 600 });
    await popup.reload();
    await expect(popup.getByRole('button', { name: /~/ }).first()).toBeVisible();
    expect(await overflowing(popup)).toEqual([]);
  }
});
