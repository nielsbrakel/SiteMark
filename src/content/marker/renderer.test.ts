import { afterEach, describe, expect, it, vi } from 'vitest';
import { aPlan, recordingViews, rendererDeps } from '../../../tests/unit/marker-renderer';
import { aPageItem, resetDocument } from '../../../tests/unit/marker-view';
import { emptyPlan } from '../../core/render/render-plan';
import { createConsoleLogger } from '../../platform/logger';
import { markerViewCss } from '../../shared/marker-view/marker-view-css';
import { createRenderer, type Renderer } from './renderer';

const renderers: Renderer[] = [];

afterEach(() => {
  for (const renderer of renderers.splice(0)) renderer.dispose();
  resetDocument();
  for (const node of [...document.documentElement.children]) {
    if (node !== document.head && node !== document.body) node.remove();
  }
});

function track(renderer: Renderer): Renderer {
  renderers.push(renderer);
  return renderer;
}

const ribbon = aPageItem('ribbon', { text: 'PROD', corner: 'top-right' }, { key: 'm1:ribbon' });
const tint = aPageItem('tint', { opacityPct: 10 }, { key: 'm1:tint' });
const frame = aPageItem('frame', { widthPx: 4, nesting: 0, insetPx: 0 }, { key: 'm2:frame' });

describe('REQ-RND-009 with no active group the marker does nothing', () => {
  it('creates no host, reads no labels and changes no DOM for an empty plan', () => {
    const MutationObserverSpy = vi.spyOn(globalThis, 'MutationObserver');
    const { deps, hosts, labels } = rendererDeps();
    const before = [...document.querySelectorAll('*')];
    const renderer = track(createRenderer(deps));
    renderer.apply(emptyPlan());
    renderer.apply(emptyPlan());
    expect(hosts.create).not.toHaveBeenCalled();
    expect(labels).not.toHaveBeenCalled();
    expect(MutationObserverSpy).not.toHaveBeenCalled();
    expect([...document.querySelectorAll('*')]).toEqual(before);
  });

  it('creates the host on the first plan with items, once, and adopts the view styles once', () => {
    const { deps, hosts } = rendererDeps();
    const renderer = track(createRenderer(deps));
    renderer.apply(aPlan(ribbon));
    renderer.apply(aPlan(ribbon, tint));
    expect(hosts.create).toHaveBeenCalledOnce();
    expect(hosts.hosts[0]?.adopted).toEqual([[markerViewCss()]]);
    expect(hosts.hosts[0]?.show).toHaveBeenCalled();
  });

  it('removes the host and every view when the plan becomes empty', () => {
    const { deps, hosts, views } = rendererDeps();
    const renderer = track(createRenderer(deps));
    renderer.apply(aPlan(ribbon, tint));
    renderer.apply(emptyPlan());
    expect(hosts.hosts[0]?.isDisposed()).toBe(true);
    expect(views.live()).toEqual([]);
    expect(document.querySelector('fake-sitemark-root')).toBeNull();
  });

  it('creates a new host when items come back after an empty plan', () => {
    const { deps, hosts, views } = rendererDeps();
    const renderer = track(createRenderer(deps));
    renderer.apply(aPlan(ribbon));
    renderer.apply(emptyPlan());
    renderer.apply(aPlan(ribbon));
    expect(hosts.create).toHaveBeenCalledTimes(2);
    expect(views.live().map((view) => view.ctx.container)).toEqual([hosts.hosts[1]?.root]);
  });
});

describe('REQ-RND-009 one failing effect never removes the others', () => {
  it('mounts the other views when one throws, and logs the error', () => {
    const views = recordingViews({ mount: 'm1:tint' });
    const { deps, logger } = rendererDeps({ createView: views.create });
    track(createRenderer(deps)).apply(aPlan(ribbon, tint, frame));
    expect(views.live().map((view) => view.item.key)).toEqual(['m1:ribbon', 'm2:frame']);
    expect(logger.entries).toEqual([
      expect.objectContaining({ level: 'error', message: expect.stringContaining('m1:tint') }),
    ]);
  });

  it('keeps updating the other views when one update throws, and re-mounts the failed one', () => {
    const views = recordingViews({ update: 'm1:ribbon' });
    const { deps, logger } = rendererDeps({ createView: views.create });
    const renderer = track(createRenderer(deps));
    renderer.apply(aPlan(ribbon, tint));
    const changedTint = { ...tint, params: { opacityPct: 20 } };
    const changedRibbon = { ...ribbon, params: { text: 'LIVE', corner: 'top-left' as const } };
    renderer.apply(aPlan(changedRibbon, changedTint));
    const tintView = views.views.find((view) => view.item.key === 'm1:tint');
    expect(tintView?.updates).toEqual([{ ...changedTint, z: 1 }]);
    const ribbons = views.views.filter((view) => view.item.key === 'm1:ribbon');
    expect(ribbons.map((view) => view.isDisposed())).toEqual([true, false]);
    expect(ribbons[1]?.item).toEqual({ ...changedRibbon, z: 0 });
    expect(logger.entries).toHaveLength(1);
  });

  it('disposes the other views when one dispose throws', () => {
    const views = recordingViews({ dispose: 'm1:ribbon' });
    const { deps, hosts } = rendererDeps({ createView: views.create });
    const renderer = track(createRenderer(deps));
    renderer.apply(aPlan(ribbon, tint, frame));
    renderer.dispose();
    expect(views.live().map((view) => view.item.key)).toEqual(['m1:ribbon']);
    expect(hosts.hosts[0]?.isDisposed()).toBe(true);
  });

  it('logs with the [SiteMark] prefix through the console logger', () => {
    const sink = { warn: vi.fn(), error: vi.fn() };
    const views = recordingViews({ mount: 'm1:ribbon' });
    const { deps } = rendererDeps({ createView: views.create, logger: createConsoleLogger(sink) });
    track(createRenderer(deps)).apply(aPlan(ribbon));
    expect(sink.error).toHaveBeenCalledOnce();
    expect(String(sink.error.mock.calls[0]?.[0])).toMatch(/^\[SiteMark\] /);
  });
});

describe('REQ-RND-009 a Disposer per view cleans up what was added for it', () => {
  it('removes the listeners registered for a view when that view goes', () => {
    const listener = vi.fn();
    const { deps } = rendererDeps({
      onViewMount: (_item, view, disposer) => disposer.listen(view.el, 'pointermove', listener),
    });
    const renderer = track(createRenderer(deps));
    renderer.apply(aPlan(ribbon, tint));
    const [ribbonEl, tintEl] = [...document.querySelectorAll<HTMLElement>('[data-key]')];
    renderer.apply(aPlan(tint));
    ribbonEl?.dispatchEvent(new Event('pointermove'));
    tintEl?.dispatchEvent(new Event('pointermove'));
    expect(listener).toHaveBeenCalledOnce();
  });

  it('isolates a failing onViewMount hook', () => {
    const { deps, views, logger } = rendererDeps({
      onViewMount: (item) => {
        if (item.key === 'm1:ribbon') throw new Error('hook failed');
      },
    });
    track(createRenderer(deps)).apply(aPlan(ribbon, tint));
    expect(views.live()).toHaveLength(2);
    expect(logger.entries).toHaveLength(1);
  });
});

describe('REQ-RND-009 REQ-RND-012 disposing and losing the host', () => {
  it('dispose() removes every view and the host, once, and ignores later plans', () => {
    const { deps, hosts, views } = rendererDeps();
    const renderer = track(createRenderer(deps));
    renderer.apply(aPlan(ribbon, tint));
    renderer.dispose();
    renderer.dispose();
    renderer.apply(aPlan(ribbon));
    expect(views.live()).toEqual([]);
    expect(hosts.create).toHaveBeenCalledOnce();
    expect(hosts.hosts[0]?.isDisposed()).toBe(true);
  });

  it('reports a host that went away on its own and stops rendering', () => {
    const onHostLost = vi.fn();
    const { deps, hosts, views } = rendererDeps({ onHostLost });
    const renderer = track(createRenderer(deps));
    renderer.apply(aPlan(ribbon, tint));
    hosts.hosts[0]?.lose();
    renderer.apply(aPlan(frame));
    expect(onHostLost).toHaveBeenCalledOnce();
    expect(views.live()).toEqual([]);
    expect(hosts.create).toHaveBeenCalledOnce();
  });

  it('does not report the host it removed itself', () => {
    const onHostLost = vi.fn();
    const { deps } = rendererDeps({ onHostLost });
    const renderer = track(createRenderer(deps));
    renderer.apply(aPlan(ribbon));
    renderer.apply(emptyPlan());
    renderer.apply(aPlan(ribbon));
    renderer.dispose();
    expect(onHostLost).not.toHaveBeenCalled();
  });
});
