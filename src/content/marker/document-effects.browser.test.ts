import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { aFaviconItem, aTitlePrefixItem } from '../../../tests/unit/document-items';
import {
  createDocumentEffects,
  type DocumentEffects,
  type DocumentEffectsOptions,
} from './document-effects';

const RED = [201, 58, 46];
const WHITE = [255, 255, 255];
const BLUE = [31, 111, 235];

let effects: DocumentEffects | undefined;

function track(options?: DocumentEffectsOptions): DocumentEffects {
  effects = createDocumentEffects(options);
  return effects;
}

const iconLinks = () => [...document.querySelectorAll<HTMLLinkElement>('link[rel~="icon" i]')];

/** A 32 px solid blue PNG as a data URL: a same-origin favicon that doesn't taint the canvas. */
function blueIcon(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const context = canvas.getContext('2d');
  if (context) {
    context.fillStyle = '#1f6feb';
    context.fillRect(0, 0, 32, 32);
  }
  return canvas.toDataURL('image/png');
}

function addIconLink(href: string, rel = 'icon'): HTMLLinkElement {
  const link = document.createElement('link');
  link.rel = rel;
  link.href = href;
  document.head.append(link);
  return link;
}

/** The RGB of pixel (x, y) of the image at `href`, drawn at 32 × 32. */
async function pixelOf(href: string, x: number, y: number): Promise<number[]> {
  const image = new Image();
  image.src = href;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const context = canvas.getContext('2d');
  context?.drawImage(image, 0, 0, 32, 32);
  return [...(context?.getImageData(x, y, 1, 1).data ?? [])].slice(0, 3);
}

async function settledStatus(of: DocumentEffects, expected: string): Promise<void> {
  await vi.waitFor(() => expect(of.faviconStatus()).toBe(expected), { timeout: 3000 });
}

beforeEach(() => {
  for (const link of iconLinks()) link.remove();
  document.title = 'Customers';
});

afterEach(() => {
  effects?.dispose();
  effects = undefined;
  for (const link of iconLinks()) link.remove();
});

describe('REQ-MARK-010 favicon tint', () => {
  it('draws the original favicon with a 12 px dot in the mark color and a 2 px white ring', async () => {
    const original = addIconLink(blueIcon());
    const effects = track();
    effects.apply([aFaviconItem('#c93a2e')]);
    await settledStatus(effects, 'available');

    const [ours, ...others] = iconLinks();
    expect(others).toEqual([]);
    expect(ours).not.toBe(original);
    const href = ours?.href ?? '';
    expect(href.startsWith('data:image/png')).toBe(true);
    expect(await pixelOf(href, 24, 24)).toEqual(RED); // the dot's center
    expect(await pixelOf(href, 24, 17)).toEqual(WHITE); // the ring, 7 px above the center
    expect(await pixelOf(href, 4, 4)).toEqual(BLUE); // the original
  });

  it('reports the status to the caller when it settles', async () => {
    addIconLink(blueIcon(), 'shortcut icon');
    const onFaviconStatus = vi.fn();
    track({ onFaviconStatus }).apply([aFaviconItem()]);
    await vi.waitFor(() => expect(onFaviconStatus).toHaveBeenCalledWith('available'));
  });

  it('redraws in a new color from the same original', async () => {
    addIconLink(blueIcon());
    const effects = track();
    effects.apply([aFaviconItem('#c93a2e')]);
    await settledStatus(effects, 'available');
    effects.apply([aFaviconItem('#1f6feb')]);
    await vi.waitFor(async () => {
      const [ours, ...others] = iconLinks();
      expect(others).toEqual([]);
      expect(await pixelOf(ours?.href ?? '', 24, 24)).toEqual(BLUE);
    });
  });

  it('restores the original links in place on removal', async () => {
    const first = addIconLink(blueIcon());
    const second = addIconLink(blueIcon(), 'shortcut icon');
    const after = document.createElement('meta');
    document.head.append(after);
    const effects = track();
    effects.apply([aFaviconItem()]);
    await settledStatus(effects, 'available');
    expect(first.isConnected).toBe(false);

    effects.clear();
    expect(effects.faviconStatus()).toBe('off');
    expect(iconLinks()).toEqual([first, second]);
    expect(second.nextSibling).toBe(after);
    after.remove();
  });

  it('restores the originals when a plan no longer has the tint', async () => {
    const original = addIconLink(blueIcon());
    const effects = track();
    effects.apply([aFaviconItem()]);
    await settledStatus(effects, 'available');
    effects.apply([aTitlePrefixItem('PROD')]);
    expect(effects.faviconStatus()).toBe('off');
    expect(iconLinks()).toEqual([original]);
    expect(document.title).toBe('PROD Customers');
  });

  it('is off without a favicon item', () => {
    expect(track().faviconStatus()).toBe('off');
  });

  it('leaves the favicon unchanged and reports unavailable when the original fails to load', async () => {
    const original = addIconLink('http://127.0.0.1:9/unreachable.png');
    const effects = track();
    effects.apply([aFaviconItem()]);
    await settledStatus(effects, 'unavailable');
    expect(iconLinks()).toEqual([original]);
  });

  it('reports unavailable when the canvas is tainted', async () => {
    const original = addIconLink(blueIcon());
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(() => {
      throw new DOMException('Tainted canvases may not be exported.', 'SecurityError');
    });
    const effects = track();
    effects.apply([aFaviconItem()]);
    await settledStatus(effects, 'unavailable');
    expect(iconLinks()).toEqual([original]);
  });

  it('reports unavailable when the original never loads (timeout)', async () => {
    const original = addIconLink(blueIcon());
    vi.spyOn(HTMLImageElement.prototype, 'src', 'set').mockImplementation(() => undefined);
    const effects = track({ faviconTimeoutMs: 50 });
    effects.apply([aFaviconItem()]);
    await settledStatus(effects, 'unavailable');
    expect(iconLinks()).toEqual([original]);
  });

  it('falls back to /favicon.ico without a link, anonymously (no credentials sent)', async () => {
    const requests: { src: string; crossOrigin: string | null }[] = [];
    vi.spyOn(HTMLImageElement.prototype, 'src', 'set').mockImplementation(function (
      this: HTMLImageElement,
      src: string,
    ) {
      requests.push({ src, crossOrigin: this.crossOrigin });
    });
    const effects = track({ faviconTimeoutMs: 50 });
    effects.apply([aFaviconItem()]);
    await settledStatus(effects, 'unavailable');
    expect(requests).toEqual([
      { src: new URL('/favicon.ico', location.href).href, crossOrigin: 'anonymous' },
    ]);
    expect(iconLinks()).toEqual([]);
  });

  it('only draws validated hex colors', async () => {
    const original = addIconLink(blueIcon());
    const effects = track();
    effects.apply([aFaviconItem('red; background: url(x)')]);
    await settledStatus(effects, 'unavailable');
    expect(iconLinks()).toEqual([original]);
  });

  it('ignores a load that finishes after removal', async () => {
    const original = addIconLink(blueIcon());
    const effects = track();
    effects.apply([aFaviconItem()]);
    effects.clear();
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(effects.faviconStatus()).toBe('off');
    expect(iconLinks()).toEqual([original]);
  });
});
