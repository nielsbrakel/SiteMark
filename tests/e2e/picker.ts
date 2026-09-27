import type { BrowserContext, Locator, Page, Worker } from '@playwright/test';
import { dispatchCommand } from './background';
import { expect } from './fixtures';

/**
 * The picker's glass pane inside `<sitemark-picker>` (src/content/picker/glass-pane.ts). The e2e
 * build attaches the shadow root open (D-226), so Playwright's CSS engine pierces it.
 */
const PICKER_PANE = 'sitemark-picker [data-part="pane"]';

/** Waits until exactly one picker is on the page and returns its glass pane. */
export async function waitForPicker(page: Page, timeout = 10_000): Promise<Locator> {
  const pane = page.locator(PICKER_PANE);
  await expect(pane).toHaveCount(1, { timeout });
  return pane;
}

/** A part of the picker UI by its `data-part` (pane, outline, tooltip, live, panel…). */
export function pickerPart(page: Page, name: string): Locator {
  return page.locator(`sitemark-picker [data-part="${name}"]`);
}

/**
 * Starts the picker on `page` like the start-picker shortcut does, once the welcome tab from the
 * install is open (so `page` stays the active tab), and waits for it.
 */
export async function startPicking(
  context: BrowserContext,
  page: Page,
  worker: Worker,
): Promise<Locator> {
  const welcome = () => context.pages().some((tab) => tab.url().includes('/options.html'));
  await expect.poll(welcome).toBe(true);
  await page.bringToFront();
  expect(await dispatchCommand(worker, 'start-picker')).toBe(true);
  return waitForPicker(page);
}

/** The center of an element in viewport coordinates, for `page.mouse`. */
export async function centerOf(locator: Locator): Promise<{ x: number; y: number }> {
  const box = await locator.boundingBox();
  if (!box) throw new Error('The element has no box');
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}
