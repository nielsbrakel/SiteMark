import type { Page } from '@playwright/test';

// Reflow checks (REQ-A11Y-012, WCAG 1.4.10): nothing may need horizontal scrolling.

/** Whether the document scrolls horizontally. */
export function scrollsHorizontally(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth > root.clientWidth;
  });
}

/** Elements that stick out of the viewport's width or cut off their own content horizontally. */
export function overflowing(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const describe = (el: Element) =>
      `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}: ${el.textContent?.trim().slice(0, 40)}`;
    return [...document.body.querySelectorAll('*')]
      .filter((el) => {
        const box = el.getBoundingClientRect();
        if (box.width <= 1) return false; // visually hidden text
        const clipped = el instanceof HTMLElement && el.scrollWidth > el.clientWidth + 1;
        const style = getComputedStyle(el);
        return (
          box.right > width + 0.5 || box.left < -0.5 || (clipped && style.overflowX !== 'visible')
        );
      })
      .map(describe);
  });
}
