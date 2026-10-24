import { afterEach, describe, expect, it, vi } from 'vitest';
import { revealOnView } from './reveal';

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

function sheets() {
  const made = [document.createElement('div'), document.createElement('div')];
  for (const sheet of made) sheet.className = 'sm-tape';
  document.body.append(...made);
  return made;
}

describe('REQ-WEBUX-001 the tape animation starts when the sheet comes into view', () => {
  it('marks a sheet seen once it intersects, and stops watching it', () => {
    let callback: IntersectionObserverCallback = () => undefined;
    const unobserve = vi.fn();
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: IntersectionObserverCallback) {
          callback = cb;
        }
        observe = vi.fn();
        unobserve = unobserve;
      },
    );
    const [a, b] = sheets();
    revealOnView(document);
    expect(a).not.toHaveAttribute('data-seen');
    callback(
      [
        { target: a, isIntersecting: true },
        { target: b, isIntersecting: false },
      ] as unknown as IntersectionObserverEntry[],
      {} as IntersectionObserver,
    );
    expect(a).toHaveAttribute('data-seen');
    expect(b).not.toHaveAttribute('data-seen');
    expect(unobserve).toHaveBeenCalledWith(a);
  });

  it('shows every sheet at once without IntersectionObserver', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const all = sheets();
    revealOnView(document);
    for (const sheet of all) expect(sheet).toHaveAttribute('data-seen');
  });
});
