import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { aPlan, onElement, rendererDeps } from '../../../tests/unit/marker-renderer';
import { aPageItem, resetDocument } from '../../../tests/unit/marker-view';
import { emptyPlan } from '../../core/render/render-plan';
import { createRenderer, type DocumentEffects, type Renderer } from './renderer';

const renderers: Renderer[] = [];

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  for (const renderer of renderers.splice(0)) renderer.dispose();
  resetDocument();
  vi.useRealTimers();
});

function aRenderer(overrides: Parameters<typeof rendererDeps>[0] = {}) {
  const onStatusChange = vi.fn();
  const setup = rendererDeps({ onStatusChange, ...overrides });
  const renderer = createRenderer(setup.deps);
  renderers.push(renderer);
  return { renderer, onStatusChange, ...setup };
}

function addApp(id = 'app'): HTMLElement {
  const el = document.createElement('div');
  el.id = id;
  document.body.append(el);
  return el;
}

const ribbon = aPageItem('ribbon', { text: 'PROD', corner: 'top-right' }, { key: 'm0:ribbon' });

describe('REQ-RND-005 the tab reports the status of every element mark', () => {
  it('reports found and missing element marks, one entry per mark, in plan order', () => {
    addApp();
    const { renderer } = aRenderer();
    renderer.apply(
      aPlan(
        ribbon,
        onElement('#missing', 'markMissing1', 'tint'),
        onElement('#app', 'markFound001', 'tint'),
        onElement('#app', 'markFound001', 'outline'),
      ),
    );
    expect(renderer.status()).toEqual({
      marks: [
        { markId: 'markMissing1', found: false },
        { markId: 'markFound001', found: true },
      ],
      favicon: 'off',
      hidden: false,
    });
  });

  it('reports an idle tab as having no marks', () => {
    const { renderer } = aRenderer();
    renderer.apply(emptyPlan());
    expect(renderer.status()).toEqual({ marks: [], favicon: 'off', hidden: false });
  });

  it('tells the marker when a missing element shows up (200 ms after the DOM change)', async () => {
    const { renderer, onStatusChange } = aRenderer();
    renderer.apply(aPlan(onElement('#app', 'markLate0001')));
    onStatusChange.mockClear();
    addApp();
    await vi.advanceTimersByTimeAsync(250);
    expect(onStatusChange).toHaveBeenCalled();
    expect(renderer.status().marks).toEqual([{ markId: 'markLate0001', found: true }]);
  });

  it('tells the marker after every plan', () => {
    const { renderer, onStatusChange } = aRenderer();
    renderer.apply(aPlan(ribbon));
    expect(onStatusChange).toHaveBeenCalled();
  });

  it('takes the favicon status from the document effects', () => {
    const documentEffects: DocumentEffects = {
      apply: vi.fn(),
      faviconStatus: () => 'unavailable',
      dispose: vi.fn(),
    };
    const { renderer } = aRenderer({ documentEffects });
    expect(renderer.status().favicon).toBe('unavailable');
  });

  it('stops observing the page when the plan has no element marks left', async () => {
    const { renderer, onStatusChange } = aRenderer();
    renderer.apply(aPlan(ribbon, onElement('#app', 'markLate0001')));
    renderer.apply(aPlan(ribbon));
    onStatusChange.mockClear();
    addApp();
    await vi.advanceTimersByTimeAsync(500);
    expect(onStatusChange).not.toHaveBeenCalled();
    expect(renderer.status().marks).toEqual([]);
  });
});

describe('REQ-RND-008 the hidden state (placeholder until T-098)', () => {
  it('hides the view container, reports hidden and tells the marker', () => {
    const { renderer, hosts, onStatusChange } = aRenderer();
    renderer.apply(aPlan(ribbon));
    onStatusChange.mockClear();
    renderer.setHidden(true);
    expect(hosts.hosts[0]?.root.hidden).toBe(true);
    expect(renderer.status().hidden).toBe(true);
    expect(onStatusChange).toHaveBeenCalledOnce();
    renderer.setHidden(false);
    expect(hosts.hosts[0]?.root.hidden).toBe(false);
  });

  it('keeps a host created while hidden hidden', () => {
    const { renderer, hosts } = aRenderer();
    renderer.setHidden(true);
    expect(hosts.create).not.toHaveBeenCalled();
    renderer.apply(aPlan(ribbon));
    expect(hosts.hosts[0]?.root.hidden).toBe(true);
  });
});
