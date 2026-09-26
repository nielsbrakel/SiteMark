import type { Locator, Page } from '@playwright/test';
import { expect } from './fixtures';

/**
 * The marker's view container inside `<sitemark-root>` (src/content/marker/host-element.ts).
 * Playwright's CSS engine pierces open shadow roots, and e2e builds attach them open (D-226).
 * A `<sitemark-root>` planted by a page has no such container, so it never matches.
 */
const MARKER_ROOT = 'sitemark-root [data-sitemark-root]';

/** Waits until exactly one SiteMark marker host is on the page and returns its view container. */
export async function waitForMarker(page: Page, timeout = 10_000): Promise<Locator> {
  const root = page.locator(MARKER_ROOT);
  await expect(root).toHaveCount(1, { timeout });
  return root;
}
