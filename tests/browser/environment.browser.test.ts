import { afterEach, describe, expect, it } from 'vitest';

// Guards the browser test layer itself: these specs must run in a real engine with layout,
// the top layer and constructable stylesheets, which happy-dom can't provide (D-233).
describe('REQ-NFR-004 browser tests run in a real Chromium', () => {
  afterEach(() => document.body.replaceChildren());

  it('lays elements out', () => {
    const box = document.createElement('div');
    box.style.setProperty('width', '120px');
    box.style.setProperty('height', '40px');
    document.body.append(box);
    expect(box.getBoundingClientRect().width).toBe(120);
    expect(document.elementsFromPoint(10, 10)).toContain(box);
  });

  it('supports the popover top layer and adopted stylesheets', () => {
    const host = document.createElement('div');
    host.popover = 'manual';
    document.body.append(host);
    host.showPopover();
    expect(host.matches(':popover-open')).toBe(true);

    const root = host.attachShadow({ mode: 'open' });
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(':host { color: rgb(1, 2, 3); }');
    root.adoptedStyleSheets = [sheet];
    expect(getComputedStyle(host).color).toBe('rgb(1, 2, 3)');
  });
});
