import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ViewRect } from '../../shared/marker-view/effect-view';
import { createTracker, type TrackedView, type Tracker } from './tracker';

const trackers: Tracker[] = [];
const nodes: Element[] = [];

afterEach(() => {
  for (const tracker of trackers.splice(0)) tracker.dispose();
  for (const node of nodes.splice(0)) node.remove();
  window.scrollTo(0, 0);
});

function aTracker(): Tracker {
  const tracker = createTracker();
  trackers.push(tracker);
  return tracker;
}

/** A view that records every rect it gets. */
function aView(): TrackedView & { rects: (ViewRect | null)[]; last(): ViewRect | null } {
  const rects: (ViewRect | null)[] = [];
  return {
    rects,
    setRect: (rect) => rects.push(rect),
    last: () => rects.at(-1) ?? null,
  };
}

/** An absolutely placed box in the page (or in `parent`). */
function aBox(style: string, parent: Element = document.body): HTMLElement {
  const box = document.createElement('div');
  box.setAttribute('style', style);
  parent.append(box);
  nodes.push(box);
  return box;
}

async function nextFrame(): Promise<void> {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

/** A frame for the ResizeObserver to notice, then one for the tracker to measure. */
async function frames(count = 3): Promise<void> {
  for (let i = 0; i < count; i++) await nextFrame();
}

function plain(rect: ViewRect | null) {
  return rect && { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
}

describe('REQ-RND-003 element overlays follow their target', () => {
  it('places the view on the target box in viewport coordinates in the next frame', async () => {
    const target = aBox('position:absolute; left:30px; top:40px; width:120px; height:60px');
    const view = aView();
    aTracker().track([{ target, view }]);
    expect(view.rects).toEqual([]);
    await frames();
    expect(plain(view.last())).toEqual({ left: 30, top: 40, width: 120, height: 60 });
  });

  it('follows the page when it scrolls', async () => {
    aBox('position:absolute; left:0; top:0; width:10px; height:5000px');
    const target = aBox('position:absolute; left:10px; top:900px; width:50px; height:50px');
    const view = aView();
    aTracker().track([{ target, view }]);
    await frames();
    window.scrollTo(0, 400);
    await frames();
    expect(view.last()?.top).toBe(500);
  });

  it('follows a target inside a nested scroll container', async () => {
    const scroller = aBox(
      'position:absolute; left:0; top:0; width:200px; height:200px; overflow:auto',
    );
    aBox('position:absolute; left:0; top:0; width:10px; height:2000px', scroller);
    const target = aBox('position:absolute; left:0; top:300px; width:50px; height:50px', scroller);
    const view = aView();
    aTracker().track([{ target, view }]);
    await frames();
    scroller.scrollTop = 250;
    await frames();
    expect(view.last()?.top).toBe(50);
  });

  it('follows the target when it resizes', async () => {
    const target = aBox('position:absolute; left:0; top:0; width:100px; height:50px');
    const view = aView();
    aTracker().track([{ target, view }]);
    await frames();
    target.style.setProperty('width', '220px');
    await frames();
    expect(view.last()?.width).toBe(220);
  });

  it('re-measures on invalidate(), e.g. after a DOM move', async () => {
    const target = aBox('position:absolute; left:0; top:0; width:100px; height:50px');
    const view = aView();
    const tracker = aTracker();
    tracker.track([{ target, view }]);
    await frames();
    target.style.setProperty('left', '75px');
    tracker.invalidate();
    await frames();
    expect(view.last()?.left).toBe(75);
  });

  it('batches many changes into one measurement per frame', async () => {
    const target = aBox('position:absolute; left:0; top:0; width:100px; height:50px');
    const view = aView();
    const tracker = aTracker();
    tracker.track([{ target, view }]);
    await frames();
    const before = view.rects.length;
    for (let i = 0; i < 10; i++) {
      tracker.invalidate();
      window.dispatchEvent(new Event('resize'));
      document.dispatchEvent(new Event('scroll'));
    }
    await nextFrame();
    expect(view.rects.length - before).toBe(1);
  });

  it('measures a target once per frame, however many views sit on it', async () => {
    const target = aBox('position:absolute; left:0; top:0; width:100px; height:50px');
    const measure = vi.spyOn(target, 'getBoundingClientRect');
    const [a, b] = [aView(), aView()];
    aTracker().track([
      { target, view: a },
      { target, view: b },
    ]);
    await nextFrame();
    expect(measure).toHaveBeenCalledTimes(1);
    expect(a.last()).toEqual(b.last());
  });
});

describe('REQ-RND-003 the overlay hides while its target is hidden or removed', () => {
  it('passes null for a missing target', async () => {
    const view = aView();
    aTracker().track([{ target: undefined, view }]);
    await frames();
    expect(view.rects).toEqual([null]);
  });

  it('passes null once the target is display:none, and a rect again when it is back', async () => {
    const target = aBox('position:absolute; left:0; top:0; width:100px; height:50px');
    const view = aView();
    aTracker().track([{ target, view }]);
    await frames();
    target.style.setProperty('display', 'none');
    await frames();
    expect(view.last()).toBeNull();
    target.style.setProperty('display', 'block');
    await frames();
    expect(view.last()?.width).toBe(100);
  });

  it('passes null once the target is removed from the document', async () => {
    const target = aBox('position:absolute; left:0; top:0; width:100px; height:50px');
    const view = aView();
    const tracker = aTracker();
    tracker.track([{ target, view }]);
    await frames();
    target.remove();
    tracker.invalidate();
    await frames();
    expect(view.last()).toBeNull();
  });

  it('passes null for a target with no size', async () => {
    const target = aBox('position:absolute; left:0; top:0; width:0; height:0');
    const view = aView();
    aTracker().track([{ target, view }]);
    await frames();
    expect(view.last()).toBeNull();
  });
});

describe('REQ-RND-003 REQ-RND-009 the tracker only listens while it has entries', () => {
  it('adds no listeners before the first entry and removes them all when emptied', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    const tracker = aTracker();
    tracker.track([]);
    expect(add).not.toHaveBeenCalled();
    const target = aBox('position:absolute; width:10px; height:10px');
    tracker.track([{ target, view: aView() }]);
    expect(add.mock.calls.map(([type]) => type).sort()).toEqual(['resize', 'scroll']);
    tracker.track([]);
    expect(remove.mock.calls.map(([type]) => type).sort()).toEqual(['resize', 'scroll']);
  });

  it('listens to scroll in the capture phase, passively', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const target = aBox('position:absolute; width:10px; height:10px');
    aTracker().track([{ target, view: aView() }]);
    const scroll = add.mock.calls.find(([type]) => type === 'scroll');
    expect(scroll?.[2]).toEqual({ capture: true, passive: true });
  });

  it('stops positioning after dispose()', async () => {
    const target = aBox('position:absolute; left:0; top:0; width:100px; height:50px');
    const view = aView();
    const tracker = aTracker();
    tracker.track([{ target, view }]);
    tracker.dispose();
    target.style.setProperty('width', '300px');
    tracker.invalidate();
    await frames();
    expect(view.rects).toEqual([]);
  });
});
