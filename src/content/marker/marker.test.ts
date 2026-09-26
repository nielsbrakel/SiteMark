import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { aPlan, onElement, rendererDeps } from '../../../tests/unit/marker-renderer';
import { aPageItem, resetDocument } from '../../../tests/unit/marker-view';
import type { TabHandlers } from '../../app/protocol';
import { emptyPlan, type RenderPlan } from '../../core/render/render-plan';
import { type Marker, type MarkerPorts, startMarker } from './marker';
import { createRenderer } from './renderer';

const markers: Marker[] = [];

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  for (const marker of markers.splice(0)) marker.dispose();
  resetDocument();
  vi.useRealTimers();
});

const ribbon = aPageItem('ribbon', { text: 'PROD', corner: 'top-right' }, { key: 'm0:ribbon' });
const tint = aPageItem('tint', { opacityPct: 10 }, { key: 'm0:tint' });

type Answer = RenderPlan | undefined | Promise<RenderPlan | undefined>;

/** Starts a marker whose background answers `plan`; returns the ports and the tab handlers. */
async function aMarker(plan: Answer = emptyPlan()) {
  const setup = rendererDeps();
  let handlers: TabHandlers | undefined;
  const unlisten = vi.fn();
  const ports = {
    requestPlan: vi.fn(async () => plan),
    reportStatus: vi.fn(),
    listen: vi.fn((next: TabHandlers) => {
      handlers = next;
      return unlisten;
    }),
    createRenderer: (hooks) => createRenderer({ ...setup.deps, ...hooks }),
  } satisfies MarkerPorts;
  markers.push(startMarker(ports));
  await vi.advanceTimersByTimeAsync(0);
  const tab = () => {
    if (!handlers) throw new Error('the marker did not listen');
    return handlers;
  };
  return { ports, tab, unlisten, ...setup };
}

function addApp(): void {
  const el = document.createElement('div');
  el.id = 'app';
  document.body.append(el);
}

describe('REQ-RND-005 the marker reports each element mark to the background', () => {
  it('asks for its plan at start, applies it and reports the element status', async () => {
    const { ports, hosts } = await aMarker(aPlan(ribbon, onElement('#app', 'markApp00001')));
    expect(ports.requestPlan).toHaveBeenCalledOnce();
    expect(hosts.create).toHaveBeenCalledOnce();
    expect(ports.reportStatus.mock.calls).toEqual([
      [{ marks: [{ markId: 'markApp00001', found: false }], favicon: 'off', hidden: false }],
    ]);
  });

  it('reports again when the element shows up, and only on changes', async () => {
    const { ports } = await aMarker(aPlan(onElement('#app', 'markApp00001')));
    addApp();
    await vi.advanceTimersByTimeAsync(500);
    document.body.append(document.createElement('p'));
    await vi.advanceTimersByTimeAsync(500);
    expect(ports.reportStatus.mock.calls.map(([status]) => status.marks)).toEqual([
      [{ markId: 'markApp00001', found: false }],
      [{ markId: 'markApp00001', found: true }],
    ]);
  });

  it('answers getStatus with the current status', async () => {
    addApp();
    const { tab } = await aMarker(aPlan(onElement('#app', 'markApp00001')));
    expect(tab().getStatus(undefined)).toEqual({
      marks: [{ markId: 'markApp00001', found: true }],
      favicon: 'off',
      hidden: false,
    });
  });

  it('reports the hidden state when the background sets it', async () => {
    const { ports, tab } = await aMarker(aPlan(ribbon));
    tab().setHidden({ hidden: true });
    expect(ports.reportStatus).toHaveBeenLastCalledWith({
      marks: [],
      favicon: 'off',
      hidden: true,
    });
  });
});

describe('REQ-RND-009 an idle tab stays silent', () => {
  it('creates nothing and reports nothing for an empty plan', async () => {
    const { ports, hosts } = await aMarker(emptyPlan());
    expect(hosts.create).not.toHaveBeenCalled();
    expect(ports.reportStatus).not.toHaveBeenCalled();
  });

  it('stays idle when the background does not answer', async () => {
    const { ports, hosts } = await aMarker(undefined);
    expect(hosts.create).not.toHaveBeenCalled();
    expect(ports.reportStatus).not.toHaveBeenCalled();
  });
});

describe('REQ-RND-012 a replaced or orphaned marker stops', () => {
  it('stops listening once its host is gone', async () => {
    const { hosts, unlisten } = await aMarker(aPlan(ribbon));
    hosts.hosts[0]?.lose();
    expect(unlisten).toHaveBeenCalledOnce();
  });

  it('dispose() stops listening and removes the host', async () => {
    const { hosts, unlisten } = await aMarker(aPlan(ribbon));
    markers.pop()?.dispose();
    expect(unlisten).toHaveBeenCalledOnce();
    expect(hosts.hosts[0]?.isDisposed()).toBe(true);
  });
});

describe('REQ-RND-007 plans pushed by the background reach the tab', () => {
  it('applies every pushed plan with a keyed diff', async () => {
    const { tab, views } = await aMarker(aPlan(ribbon));
    tab().applyPlan(aPlan(ribbon, tint));
    expect(views.views.map((view) => view.item.key)).toEqual(['m0:ribbon', 'm0:tint']);
  });

  it('ignores the answer to its first request once a newer plan was pushed', async () => {
    let answer: (plan: RenderPlan) => void = () => undefined;
    const pending = new Promise<RenderPlan>((resolve) => {
      answer = resolve;
    });
    const { tab, views } = await aMarker(pending);
    tab().applyPlan(aPlan(tint));
    answer(aPlan(ribbon));
    await vi.advanceTimersByTimeAsync(0);
    expect(views.live().map((view) => view.item.key)).toEqual(['m0:tint']);
  });
});
