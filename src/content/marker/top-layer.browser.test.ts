import { afterEach, describe, expect, it, vi } from 'vitest';
import { aHost, cleanUp, elementOf } from '../../../tests/browser/host-harness';

afterEach(() => {
  cleanUp();
  for (const element of document.querySelectorAll('[data-test-popover]')) element.remove();
});

function aPopover(tag: string): HTMLElement {
  const element = document.createElement(tag);
  element.setAttribute('popover', 'manual');
  element.setAttribute('data-test-popover', '');
  document.documentElement.append(element);
  return element;
}

/** Lets the browser fire the queued `toggle` events. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 50));

describe('REQ-RND-006 the host goes back on top of what the page opens', () => {
  it('re-promotes itself above a page popover', async () => {
    const host = aHost();
    host.show();
    const promote = vi.spyOn(elementOf(host), 'showPopover');
    aPopover('div').showPopover();
    await settle();
    expect(promote).toHaveBeenCalled();
  });

  it("leaves SiteMark's own picker above the marks", async () => {
    const host = aHost();
    host.show();
    const promote = vi.spyOn(elementOf(host), 'showPopover');
    aPopover('sitemark-picker').showPopover();
    await settle();
    expect(promote).not.toHaveBeenCalled();
  });
});
