import { afterEach, describe, expect, it, vi } from 'vitest';
import { aPlan, rendererDeps } from '../../../tests/unit/marker-renderer';
import { aPageItem, resetDocument } from '../../../tests/unit/marker-view';
import type { RenderItem } from '../../core/render/render-plan';
import { createView } from '../../shared/marker-view/create-view';
import { createRenderer, type DocumentEffects, type Renderer } from './renderer';

const renderers: Renderer[] = [];

afterEach(() => {
  for (const renderer of renderers.splice(0)) renderer.dispose();
  resetDocument();
});

function aRenderer(overrides: Parameters<typeof rendererDeps>[0] = {}) {
  const setup = rendererDeps(overrides);
  const renderer = createRenderer(setup.deps);
  renderers.push(renderer);
  return { renderer, ...setup };
}

function aDocumentEffects() {
  return {
    apply: vi.fn(),
    faviconStatus: () => 'off',
    dispose: vi.fn(),
  } satisfies DocumentEffects;
}

const ribbon = aPageItem('ribbon', { text: 'PROD', corner: 'top-right' }, { key: 'm1:ribbon' });
const tint = aPageItem('tint', { opacityPct: 10 }, { key: 'm1:tint' });
const banner = aPageItem(
  'banner',
  { text: 'Production', edge: 'top', size: 'compact' },
  { key: 'banner:top' },
);
const title = { ...ribbon, key: 'm1:titlePrefix', effect: 'titlePrefix', params: { text: '[P]' } };
const favicon = { ...ribbon, key: 'm1:favicon', effect: 'favicon', params: {} };
const titleItem = title as RenderItem;
const faviconItem = favicon as RenderItem;

describe('REQ-RND-007 a new plan re-mounts only the effects that changed', () => {
  it('mounts new keys, updates changed ones, disposes removed ones and leaves the rest', () => {
    const { renderer, views } = aRenderer();
    renderer.apply(aPlan(ribbon, tint));
    const [ribbonView, tintView] = views.views;
    const moreTint = { ...tint, params: { opacityPct: 25 } };
    const second = aPlan(ribbon, moreTint, banner);
    renderer.apply(second);
    // The same z values: only the ribbon goes.
    renderer.apply({ items: second.items.filter((item) => item.key !== 'm1:ribbon') });
    expect(ribbonView?.isDisposed()).toBe(true);
    expect(ribbonView?.updates).toEqual([]);
    expect(tintView?.isDisposed()).toBe(false);
    expect(tintView?.updates).toEqual([{ ...moreTint, z: 1 }]);
    expect(views.live().map((view) => view.item.key)).toEqual(['m1:tint', 'banner:top']);
  });

  it('mounts the real views in the host with the translated labels', () => {
    const { renderer, hosts } = aRenderer({ createView });
    renderer.apply(aPlan(banner));
    const root = hosts.hosts[0]?.root;
    expect(root?.querySelector('[role="note"]')?.textContent).toContain('Production');
    expect(root?.querySelector('button')?.getAttribute('aria-label')).toBe('Collapse banner');
  });

  it('keeps one set of collapsed banners for the document, across hosts', () => {
    const { renderer, views } = aRenderer();
    renderer.apply(aPlan(banner));
    renderer.apply(aPlan());
    renderer.apply(aPlan(banner));
    const [first, second] = views.views;
    expect(second?.ctx.collapsedBanners).toBe(first?.ctx.collapsedBanners);
  });
});

describe('REQ-RND-007 title prefix and favicon go to the document effects', () => {
  it('passes the plan document items on, and never draws them', () => {
    const documentEffects = aDocumentEffects();
    const { renderer, views } = aRenderer({ documentEffects });
    renderer.apply(aPlan(titleItem, faviconItem, ribbon));
    expect(documentEffects.apply).toHaveBeenCalledExactlyOnceWith([
      { ...title, z: 0 },
      { ...favicon, z: 1 },
    ]);
    expect(views.views.map((view) => view.item.key)).toEqual(['m1:ribbon']);
  });

  it('passes them again only when they change, and [] once they are gone', () => {
    const documentEffects = aDocumentEffects();
    const { renderer } = aRenderer({ documentEffects });
    renderer.apply(aPlan(titleItem, ribbon));
    renderer.apply(aPlan(titleItem, tint));
    renderer.apply(aPlan(ribbon));
    expect(documentEffects.apply.mock.calls).toEqual([[[{ ...title, z: 0 }]], [[]]]);
  });

  it('isolates a failing document effect from the drawn ones', () => {
    const documentEffects = aDocumentEffects();
    documentEffects.apply.mockImplementation(() => {
      throw new Error('title failed');
    });
    const { renderer, views, logger } = aRenderer({ documentEffects });
    renderer.apply(aPlan(titleItem, ribbon));
    expect(views.live()).toHaveLength(1);
    expect(logger.entries).toHaveLength(1);
  });

  it('restores the document on dispose', () => {
    const documentEffects = aDocumentEffects();
    const { renderer } = aRenderer({ documentEffects });
    renderer.apply(aPlan(titleItem));
    renderer.dispose();
    expect(documentEffects.dispose).toHaveBeenCalledOnce();
  });
});
