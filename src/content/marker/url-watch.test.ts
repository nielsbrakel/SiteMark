import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type UrlWatch, watchUrl } from './url-watch';

let watch: UrlWatch | undefined;

function track(onChange: (url: string) => void): UrlWatch {
  watch = watchUrl(onChange);
  return watch;
}

/** An SPA route change: the URL changes without any event (like `history.pushState`). */
function navigate(path: string): string {
  history.pushState(null, '', path);
  return location.href;
}

beforeEach(() => {
  vi.useFakeTimers();
  history.replaceState(null, '', '/start');
});

afterEach(() => {
  watch?.dispose();
  watch = undefined;
  vi.useRealTimers();
});

describe('REQ-RND-004 URL watch for SPA navigation', () => {
  it('polls location.href every 500 ms (the primary mechanism)', () => {
    const onChange = vi.fn();
    track(onChange);
    const url = navigate('/customers');
    vi.advanceTimersByTime(499);
    expect(onChange).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onChange).toHaveBeenCalledWith(url);
  });

  it('never calls back while the URL stays the same', () => {
    const onChange = vi.fn();
    track(onChange);
    vi.advanceTimersByTime(5000);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('reacts to popstate at once', () => {
    const onChange = vi.fn();
    track(onChange);
    const url = navigate('/orders');
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(onChange).toHaveBeenCalledWith(url);
  });

  it('reacts to hashchange at once', () => {
    const onChange = vi.fn();
    track(onChange);
    const url = navigate('/start#details');
    window.dispatchEvent(new Event('hashchange'));
    expect(onChange).toHaveBeenCalledWith(url);
  });

  it('reacts to the Navigation API navigatesuccess where it exists', () => {
    const navigation = new EventTarget();
    vi.stubGlobal('navigation', navigation);
    const onChange = vi.fn();
    track(onChange);
    const url = navigate('/invoices');
    navigation.dispatchEvent(new Event('navigatesuccess'));
    expect(onChange).toHaveBeenCalledWith(url);
  });

  it('calls back once per change, however many signals report it', () => {
    const onChange = vi.fn();
    track(onChange);
    const url = navigate('/orders');
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.dispatchEvent(new Event('hashchange'));
    vi.advanceTimersByTime(2000);
    expect(onChange.mock.calls).toEqual([[url]]);
  });

  it('reports every change in order, also back to an earlier URL', () => {
    const onChange = vi.fn();
    track(onChange);
    const first = navigate('/a');
    vi.advanceTimersByTime(500);
    const second = navigate('/start');
    vi.advanceTimersByTime(500);
    expect(onChange.mock.calls).toEqual([[first], [second]]);
  });

  it('stops after dispose()', () => {
    const navigation = new EventTarget();
    vi.stubGlobal('navigation', navigation);
    const onChange = vi.fn();
    track(onChange).dispose();
    navigate('/orders');
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.dispatchEvent(new Event('hashchange'));
    navigation.dispatchEvent(new Event('navigatesuccess'));
    vi.advanceTimersByTime(2000);
    expect(onChange).not.toHaveBeenCalled();
  });
});
