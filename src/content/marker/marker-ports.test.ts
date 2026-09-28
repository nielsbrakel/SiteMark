import { afterEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { aTitlePrefixItem } from '../../../tests/unit/document-items';
import { aPlan } from '../../../tests/unit/marker-renderer';
import { aPageItem } from '../../../tests/unit/marker-view';
import { emptyPlan } from '../../core/render/render-plan';
import { err, ok } from '../../core/result';
import { markerLabels, markerPorts } from './marker-ports';
import type { Renderer } from './renderer';

const renderers: Renderer[] = [];

afterEach(() => {
  for (const renderer of renderers.splice(0)) renderer.dispose();
});

/** A background that answers every message with `reply` and records what it got. */
function background(reply: unknown): unknown[] {
  const received: unknown[] = [];
  fakeBrowser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    received.push(message);
    sendResponse(reply);
    return true;
  });
  return received;
}

describe('REQ-RND-007 the marker gets its render plan from the background', () => {
  it('asks for the plan of its own URL and returns it', async () => {
    const plan = aPlan(aPageItem('ribbon', { text: 'PROD', corner: 'top-right' }));
    const received = background(ok(plan));
    await expect(markerPorts().requestPlan()).resolves.toEqual(plan);
    expect(received).toEqual([{ type: 'renderPlanFor' }]);
  });

  it.each([
    ['refused', err('messageRefused')],
    ['not answered', undefined],
  ])('returns no plan when the request is %s', async (_name, reply) => {
    background(reply);
    await expect(markerPorts().requestPlan()).resolves.toBeUndefined();
  });

  it('sends status reports to the background', async () => {
    const received = background(ok(undefined));
    const status = { marks: [], favicon: 'off', hidden: true } as const;
    markerPorts().reportStatus(status);
    await vi.waitFor(() => expect(received).toEqual([{ type: 'reportStatus', data: status }]));
  });

  it('builds a renderer on the real host', () => {
    const renderer = markerPorts().createRenderer({ onStatusChange: vi.fn(), onHostLost: vi.fn() });
    renderers.push(renderer);
    renderer.apply(emptyPlan());
    expect(document.querySelector('sitemark-root')).toBeNull();
    renderer.apply(aPlan(aPageItem('tint', { opacityPct: 10 })));
    expect(
      document.querySelector('sitemark-root')?.shadowRoot?.querySelector('.sm-tint'),
    ).not.toBeNull();
  });
});

describe('REQ-RND-007 the banner labels are translated', () => {
  it('reads the chevron labels from the locale files', () => {
    expect(markerLabels()).toEqual({
      collapseBanner: 'Collapse banner',
      expandBanner: 'Show banner',
    });
  });
});

describe('REQ-MARK-009 the marker owns the document effects', () => {
  it('applies the title prefix and restores the title when disposed', () => {
    document.title = 'Dashboard';
    const renderer = markerPorts().createRenderer({ onStatusChange: vi.fn(), onHostLost: vi.fn() });
    renderers.push(renderer);
    renderer.apply(aPlan(aTitlePrefixItem('PROD')));
    expect(document.title).toBe('PROD Dashboard');
    renderer.dispose();
    expect(document.title).toBe('Dashboard');
  });
});

describe('REQ-RND-013 the marker fades ribbons and banners near the pointer', () => {
  it('listens for the pointer only once a ribbon is drawn', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const renderer = markerPorts().createRenderer({ onStatusChange: vi.fn(), onHostLost: vi.fn() });
    renderers.push(renderer);
    renderer.apply(aPlan(aPageItem('tint', { opacityPct: 10 })));
    const pointer = () => add.mock.calls.filter(([type]) => type === 'pointermove');
    expect(pointer()).toHaveLength(0);
    renderer.apply(aPlan(aPageItem('ribbon', { text: 'PROD', corner: 'top-right' })));
    expect(pointer()).toHaveLength(1);
  });

  it('stops listening when the last ribbon or banner goes', () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    const renderer = markerPorts().createRenderer({ onStatusChange: vi.fn(), onHostLost: vi.fn() });
    renderers.push(renderer);
    renderer.apply(aPlan(aPageItem('ribbon', { text: 'PROD', corner: 'top-right' })));
    renderer.apply(aPlan(aPageItem('tint', { opacityPct: 10 })));
    expect(remove.mock.calls.filter(([type]) => type === 'pointermove')).toHaveLength(1);
  });
});

describe('REQ-RND-004 the marker watches the URL', () => {
  it('watches the URL through its ports', () => {
    const setInterval = vi.spyOn(window, 'setInterval');
    type Watch = { watchUrl?: (onChange: () => void) => () => void };
    const ports = markerPorts() as unknown as Watch;
    expect(ports.watchUrl).toBeTypeOf('function');
    const unwatch = ports.watchUrl?.(vi.fn());
    expect(setInterval).toHaveBeenCalled();
    unwatch?.();
  });
});

describe('REQ-RND-004 the marker asks at the right moments on prerendered and restored pages', () => {
  afterEach(() => {
    Reflect.deleteProperty(document, 'prerendering');
  });

  it('waits until a prerendered page is shown before asking for its plan', async () => {
    Object.defineProperty(document, 'prerendering', { value: true, configurable: true });
    const plan = aPlan(aPageItem('ribbon', { text: 'PROD', corner: 'top-right' }));
    const received = background(ok(plan));
    const answer = markerPorts().requestPlan();
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(received).toEqual([]);
    Object.defineProperty(document, 'prerendering', { value: false, configurable: true });
    document.dispatchEvent(new Event('prerenderingchange'));
    await expect(answer).resolves.toEqual(plan);
    expect(received).toEqual([{ type: 'renderPlanFor' }]);
  });

  it('asks again when the page comes back from the back/forward cache', () => {
    const onChange = vi.fn();
    const unwatch = markerPorts().watchUrl(onChange);
    const pageshow = (persisted: boolean) =>
      Object.assign(new Event('pageshow'), { persisted }) as Event;
    window.dispatchEvent(pageshow(false));
    expect(onChange).not.toHaveBeenCalled();
    window.dispatchEvent(pageshow(true));
    expect(onChange).toHaveBeenCalledOnce();
    unwatch();
    window.dispatchEvent(pageshow(true));
    expect(onChange).toHaveBeenCalledOnce();
  });
});
