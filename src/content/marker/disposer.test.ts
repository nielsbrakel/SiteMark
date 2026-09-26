import { describe, expect, it, vi } from 'vitest';
import { createDisposer } from './disposer';

describe('REQ-RND-009 a Disposer collects clean-ups and runs them in isolation', () => {
  it('runs every clean-up once, newest first', () => {
    const order: string[] = [];
    const disposer = createDisposer(vi.fn());
    disposer.add(() => order.push('first'));
    disposer.add(() => order.push('second'));
    disposer.dispose();
    disposer.dispose();
    expect(order).toEqual(['second', 'first']);
  });

  it('keeps going when a clean-up throws, and reports the error', () => {
    const onError = vi.fn();
    const after = vi.fn();
    const disposer = createDisposer(onError);
    disposer.add(after);
    disposer.add(() => {
      throw new Error('broken');
    });
    disposer.dispose();
    expect(after).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledExactlyOnceWith(new Error('broken'));
  });

  it('removes the listeners it added', () => {
    const target = new EventTarget();
    const listener = vi.fn();
    const disposer = createDisposer(vi.fn());
    disposer.listen(target, 'ping', listener, { passive: true });
    target.dispatchEvent(new Event('ping'));
    disposer.dispose();
    target.dispatchEvent(new Event('ping'));
    expect(listener).toHaveBeenCalledOnce();
  });

  it('runs a clean-up added after dispose() at once', () => {
    const late = vi.fn();
    const disposer = createDisposer(vi.fn());
    disposer.dispose();
    disposer.add(late);
    expect(late).toHaveBeenCalledOnce();
  });
});
