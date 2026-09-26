import { afterEach, describe, expect, it, vi } from 'vitest';
import { createProximityFade, type ProximityFade, type ProximityFadeOptions } from './proximity';

let fade: ProximityFade | undefined;
const boxes: HTMLElement[] = [];

function track(options: Partial<ProximityFadeOptions> = {}): ProximityFade {
  fade = createProximityFade({ elements: () => boxes, reducedMotion: () => false, ...options });
  return fade;
}

/** A fixed box at (left, top) of `width` × `height`, like a banner or a ribbon corner. */
function aBox(left: number, top: number, width: number, height: number): HTMLElement {
  const box = document.createElement('div');
  box.style.setProperty('position', 'fixed');
  box.style.setProperty('left', `${left}px`);
  box.style.setProperty('top', `${top}px`);
  box.style.setProperty('width', `${width}px`);
  box.style.setProperty('height', `${height}px`);
  document.body.append(box);
  boxes.push(box);
  return box;
}

/** The pointer moves to (x, y); the fade reacts in the next animation frame. */
async function pointerAt(x: number, y: number): Promise<void> {
  document.body.dispatchEvent(
    new PointerEvent('pointermove', { clientX: x, clientY: y, bubbles: true }),
  );
  await nextFrame();
}

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const opacityOf = (box: HTMLElement) => box.style.getPropertyValue('opacity');

afterEach(() => {
  fade?.dispose();
  fade = undefined;
  for (const box of boxes.splice(0)) box.remove();
});

describe('REQ-RND-013 proximity fade for ribbons and banners', () => {
  it('fades a node to 15 % while the pointer is within 24 px of it', async () => {
    const banner = aBox(0, 0, 400, 24);
    track();
    await pointerAt(200, 48);
    expect(opacityOf(banner)).toBe('0.15');
  });

  it('leaves a node alone when the pointer is further than 24 px away', async () => {
    const banner = aBox(0, 0, 400, 24);
    track();
    await pointerAt(200, 49);
    expect(opacityOf(banner)).toBe('');
  });

  it('restores the node when the pointer moves away', async () => {
    const banner = aBox(0, 0, 400, 24);
    track();
    await pointerAt(10, 10);
    await pointerAt(200, 300);
    expect(opacityOf(banner)).toBe('');
  });

  it('fades only the nodes near the pointer', async () => {
    const top = aBox(0, 0, 400, 24);
    const corner = aBox(300, 200, 100, 100);
    track();
    await pointerAt(280, 250);
    expect([opacityOf(top), opacityOf(corner)]).toEqual(['', '0.15']);
  });

  it('reads the nodes on every check, so new views take part', async () => {
    track();
    await pointerAt(10, 10);
    const banner = aBox(0, 0, 400, 24);
    await pointerAt(12, 10);
    expect(opacityOf(banner)).toBe('0.15');
  });

  it('ignores nodes without a box (hidden views)', async () => {
    const hidden = aBox(0, 0, 400, 24);
    hidden.style.setProperty('display', 'none');
    track();
    await pointerAt(5, 5);
    expect(opacityOf(hidden)).toBe('');
  });

  it('fades over 120 ms', async () => {
    const banner = aBox(0, 0, 400, 24);
    track();
    await pointerAt(10, 10);
    expect(banner.style.getPropertyValue('transition')).toContain('opacity 120ms');
  });

  it('fades without a transition under prefers-reduced-motion (REQ-A11Y-005)', async () => {
    const banner = aBox(0, 0, 400, 24);
    track({ reducedMotion: () => true });
    await pointerAt(10, 10);
    expect(opacityOf(banner)).toBe('0.15');
    expect(banner.style.getPropertyValue('transition')).toBe('none');
  });

  it('restores every node when the pointer leaves the window', async () => {
    const banner = aBox(0, 0, 400, 24);
    track();
    await pointerAt(10, 10);
    document.body.dispatchEvent(new PointerEvent('pointerout', { bubbles: true }));
    expect(opacityOf(banner)).toBe('');
  });

  it('measures once per animation frame, however many moves arrive', async () => {
    const banner = aBox(0, 0, 400, 24);
    const measure = vi.spyOn(banner, 'getBoundingClientRect');
    track();
    for (let x = 0; x < 5; x++) {
      document.body.dispatchEvent(
        new PointerEvent('pointermove', { clientX: x, clientY: 10, bubbles: true }),
      );
    }
    await nextFrame();
    expect(measure).toHaveBeenCalledTimes(1);
    expect(opacityOf(banner)).toBe('0.15');
  });

  it('listens passively', () => {
    const listen = vi.spyOn(window, 'addEventListener');
    track();
    const options = listen.mock.calls.find(([type]) => type === 'pointermove')?.[2];
    expect(options).toMatchObject({ passive: true });
  });

  it('restores every node and stops listening on dispose', async () => {
    const banner = aBox(0, 0, 400, 24);
    const fade = track();
    await pointerAt(10, 10);
    fade.dispose();
    expect(opacityOf(banner)).toBe('');
    expect(banner.style.getPropertyValue('transition')).toBe('');
    await pointerAt(12, 10);
    expect(opacityOf(banner)).toBe('');
  });
});
