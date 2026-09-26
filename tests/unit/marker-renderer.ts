import { vi } from 'vitest';
import { createInMemoryLogger } from '../../src/app/testing/in-memory-logger';
import type { Host, HostOptions } from '../../src/content/marker/host';
import type { RendererDeps } from '../../src/content/marker/renderer';
import type { ViewFactory } from '../../src/content/marker/view-set';
import type { RenderItem, RenderPlan } from '../../src/core/render/render-plan';
import type { EffectView, ViewContext, ViewRect } from '../../src/shared/marker-view/effect-view';

// Test support for the marker renderer (src/content/marker): a fake host in the light DOM,
// views that record what the renderer does with them, and plans built from marker-view items.

export type FakeHost = Host & {
  readonly element: HTMLElement;
  readonly options: HostOptions;
  readonly adopted: string[][];
  readonly isDisposed: () => boolean;
  /** The host disposes itself, as when a newer instance takes over or the extension is gone. */
  lose(): void;
};

function aFakeHost(options: HostOptions): FakeHost {
  const element = document.createElement('fake-sitemark-root');
  const root = document.createElement('div');
  element.append(root);
  document.documentElement.append(element);
  const adopted: string[][] = [];
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    element.remove();
    options.onDispose?.();
  };
  return {
    element,
    options,
    adopted,
    root,
    adoptStyles: (css) => adopted.push([...css]),
    show: vi.fn(),
    hide: vi.fn(),
    dispose,
    isDisposed: () => disposed,
    lose: dispose,
  };
}

/** A createHost that records every host it made. */
export function fakeHosts() {
  const hosts: FakeHost[] = [];
  const create = vi.fn((options: HostOptions) => {
    const host = aFakeHost(options);
    hosts.push(host);
    return host;
  });
  return { create, hosts };
}

export type RecordedView = EffectView & {
  readonly item: RenderItem;
  readonly ctx: ViewContext;
  readonly updates: RenderItem[];
  readonly rects: (ViewRect | null)[];
  readonly isDisposed: () => boolean;
};

export type Failures = { mount?: string; update?: string; dispose?: string };

/** A view factory whose views record their calls; `fail` names keys whose calls throw. */
export function recordingViews(fail: Failures = {}) {
  const views: RecordedView[] = [];
  const boom = (what: string, key: string) => {
    throw new Error(`${what} failed for ${key}`);
  };
  const factory: ViewFactory = (item, ctx) => {
    if (fail.mount === item.key) boom('mount', item.key);
    const el = document.createElement('div');
    el.dataset.key = item.key;
    ctx.container.append(el);
    const updates: RenderItem[] = [];
    const rects: (ViewRect | null)[] = [];
    let disposed = false;
    const view: RecordedView = {
      el,
      item,
      ctx,
      updates,
      rects,
      isDisposed: () => disposed,
      update: (next) => (fail.update === item.key ? boom('update', item.key) : updates.push(next)),
      setRect: (rect) => rects.push(rect),
      dispose: () => {
        if (fail.dispose === item.key) boom('dispose', item.key);
        disposed = true;
        el.remove();
      },
    };
    views.push(view);
    return view;
  };
  const create = vi.fn(factory);
  return { create, views, live: () => views.filter((view) => !view.isDisposed()) };
}

/** A plan of `items`, with `z` set to each item's index. */
export function aPlan(...items: RenderItem[]): RenderPlan {
  return { items: items.map((item, z) => ({ ...item, z })) };
}

const LABELS = { collapseBanner: 'Collapse banner', expandBanner: 'Show banner' };

/** Renderer dependencies with fakes; override any of them. */
export function rendererDeps(overrides: Partial<RendererDeps> = {}) {
  const hosts = fakeHosts();
  const views = recordingViews();
  const logger = createInMemoryLogger();
  const labels = vi.fn(() => LABELS);
  const deps = {
    createHost: hosts.create,
    logger,
    labels,
    createView: views.create,
    ...overrides,
  } satisfies RendererDeps;
  return { deps, hosts, views, logger, labels };
}
