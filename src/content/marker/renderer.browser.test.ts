import { afterEach, describe, expect, it } from 'vitest';
import { aPlan, onElement } from '../../../tests/unit/marker-renderer';
import { createInMemoryLogger } from '../../app/testing/in-memory-logger';
import { createHost } from './host';
import { createRenderer, type Renderer } from './renderer';

// The renderer with the real host, views, resolver and tracker in Chromium.

const renderers: Renderer[] = [];
const nodes: Element[] = [];

afterEach(() => {
  for (const renderer of renderers.splice(0)) renderer.dispose();
  for (const node of nodes.splice(0)) node.remove();
});

function aRenderer(): Renderer {
  const renderer = createRenderer({
    createHost: (options) => createHost({ ...options, isAlive: () => true }),
    logger: createInMemoryLogger(),
    labels: () => ({ collapseBanner: 'Collapse banner', expandBanner: 'Show banner' }),
  });
  renderers.push(renderer);
  return renderer;
}

function aTarget(id: string): HTMLElement {
  const el = document.createElement('div');
  el.id = id;
  el.setAttribute('style', 'position:absolute; left:40px; top:60px; width:200px; height:80px');
  document.body.append(el);
  nodes.push(el);
  return el;
}

/** The outline view inside the (open, in tests) shadow root. */
function outline(): HTMLElement | null {
  return document.querySelector('sitemark-root')?.shadowRoot?.querySelector('.sm-outline') ?? null;
}

function box(el: Element | null) {
  const rect = el?.getBoundingClientRect();
  return rect && [rect.left, rect.top, rect.width, rect.height];
}

async function frames(count = 3): Promise<void> {
  for (let i = 0; i < count; i++) {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
}

async function wait(ms: number): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
}

describe('REQ-RND-003 REQ-RND-005 element views sit on their resolved target', () => {
  it('places the outline on the first matching element', async () => {
    const target = aTarget('app');
    aRenderer().apply(aPlan(onElement('#app', 'markApp00001')));
    await frames();
    expect(outline()?.hidden).toBe(false);
    expect(box(outline())).toEqual(box(target));
  });

  it('shows nothing for a missing element, and the mark once the element appears', async () => {
    aRenderer().apply(aPlan(onElement('#late', 'markLate0001')));
    await frames();
    expect(outline()?.hidden).toBe(true);
    const target = aTarget('late');
    await wait(260);
    await frames();
    expect(outline()?.hidden).toBe(false);
    expect(box(outline())).toEqual(box(target));
  });

  it('hides the view when its target is removed', async () => {
    const target = aTarget('app');
    aRenderer().apply(aPlan(onElement('#app', 'markApp00001')));
    await frames();
    target.remove();
    await frames();
    expect(outline()?.hidden).toBe(true);
  });
});
