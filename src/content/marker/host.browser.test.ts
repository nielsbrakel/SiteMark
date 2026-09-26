import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  aHost,
  cleanUp,
  elementOf,
  pageStyle,
  plantedRoot,
} from '../../../tests/browser/host-harness';

afterEach(cleanUp);

describe('REQ-RND-001 a single <sitemark-root> host with a shadow root', () => {
  it('appends <sitemark-root popover="manual"> to <html> with an open shadow root in test builds', () => {
    const host = aHost();
    const element = elementOf(host);
    expect(element.localName).toBe('sitemark-root');
    expect(element.parentNode).toBe(document.documentElement);
    expect(element.getAttribute('popover')).toBe('manual');
    // Open in test builds (D-226), so element.shadowRoot is visible.
    expect(element.shadowRoot).toBe(host.root.getRootNode());
    expect(host.root.isConnected).toBe(true);
  });

  it('covers the viewport without taking pointer events, on top of the page', () => {
    const element = elementOf(aHost());
    const style = getComputedStyle(element);
    expect(style.display).toBe('block');
    expect(style.position).toBe('fixed');
    expect(style.pointerEvents).toBe('none');
    expect(style.zIndex).toBe('2147483647');
    const box = element.getBoundingClientRect();
    expect([box.left, box.top, box.width, box.height]).toEqual([
      0,
      0,
      document.documentElement.clientWidth,
      document.documentElement.clientHeight,
    ]);
  });

  it('show() promotes the host to the top layer and hide() takes it out again', () => {
    const host = aHost();
    const element = elementOf(host);
    host.show();
    host.show();
    expect(element.matches(':popover-open')).toBe(true);
    host.hide();
    host.hide();
    expect(element.matches(':popover-open')).toBe(false);
    expect(getComputedStyle(element).display).toBe('block');
  });

  it('keeps its backdrop hidden, whatever the page styles', () => {
    pageStyle('::backdrop { display: block !important; background: rgb(255 0 0) !important; }');
    const host = aHost();
    host.show();
    expect(getComputedStyle(elementOf(host), '::backdrop').display).toBe('none');
  });

  it('adopts style sheets into the shadow root only', () => {
    const host = aHost();
    host.adoptStyles(['.probe { color: rgb(1, 2, 3); }']);
    const probe = document.createElement('span');
    probe.className = 'probe';
    host.root.append(probe);
    expect(getComputedStyle(probe).color).toBe('rgb(1, 2, 3)');
    const pageProbe = document.createElement('span');
    pageProbe.className = 'probe';
    document.body.append(pageProbe);
    expect(getComputedStyle(pageProbe).color).not.toBe('rgb(1, 2, 3)');
    pageProbe.remove();
  });

  it('falls back to <style> elements when adopted sheets are unavailable (D-232)', () => {
    vi.spyOn(ShadowRoot.prototype, 'adoptedStyleSheets', 'set').mockImplementation(() => {
      throw new TypeError('adoptedStyleSheets is not supported here');
    });
    const host = aHost();
    host.adoptStyles(['.probe { color: rgb(4, 5, 6); }']);
    const probe = document.createElement('span');
    probe.className = 'probe';
    host.root.append(probe);
    expect(getComputedStyle(probe).color).toBe('rgb(4, 5, 6)');
    expect(getComputedStyle(elementOf(host)).position).toBe('fixed');
  });

  it('dispose() removes the host, calls onDispose once and leaves the page as it was (D-230)', () => {
    const htmlChildren = [...document.documentElement.childNodes];
    const htmlAttributes = document.documentElement.getAttributeNames();
    const bodyChildren = [...document.body.childNodes];
    const onDispose = vi.fn();
    const host = aHost({ onDispose });
    host.show();
    host.dispose();
    host.dispose();
    expect(onDispose).toHaveBeenCalledTimes(1);
    expect(elementOf(host).isConnected).toBe(false);
    expect([...document.documentElement.childNodes]).toEqual(htmlChildren);
    expect(document.documentElement.getAttributeNames()).toEqual(htmlAttributes);
    expect([...document.body.childNodes]).toEqual(bodyChildren);
  });
});

describe('REQ-SEC-006 the host resists page styles and planted elements', () => {
  it('ignores page rules aimed at <sitemark-root>, even !important ones', () => {
    pageStyle(
      'sitemark-root { display: none !important; position: static !important; opacity: 0 !important;' +
        ' visibility: hidden !important; pointer-events: auto !important; z-index: 1 !important; }',
    );
    const style = getComputedStyle(elementOf(aHost()));
    expect([style.display, style.position, style.opacity, style.visibility]).toEqual([
      'block',
      'fixed',
      '1',
      'visible',
    ]);
    expect([style.pointerEvents, style.zIndex]).toEqual(['none', '2147483647']);
  });

  it('never uses a <sitemark-root> the page planted', () => {
    const planted = plantedRoot();
    const host = aHost();
    host.show();
    expect(elementOf(host)).not.toBe(planted);
    expect(planted.shadowRoot).toBeNull();
    expect(planted.hasAttribute('popover')).toBe(false);
    host.dispose();
    expect(planted.isConnected).toBe(true);
    expect(planted.textContent).toBe('planted by the page');
  });
});
