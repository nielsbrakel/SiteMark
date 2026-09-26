import { afterEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
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
