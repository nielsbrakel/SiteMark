import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElementResolver, type ElementResolver } from './element-resolver';

let resolvers: ElementResolver[] = [];

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  for (const resolver of resolvers) resolver.dispose();
  resolvers = [];
  document.body.replaceChildren();
  vi.useRealTimers();
});

function aResolver(onMutation?: () => void) {
  const onChange = vi.fn();
  const resolver = createElementResolver(onMutation ? { onChange, onMutation } : { onChange });
  resolvers.push(resolver);
  return { resolver, onChange };
}

function add(html: { id?: string; className?: string }, parent: Element = document.body) {
  const el = document.createElement('div');
  if (html.id) el.id = html.id;
  if (html.className) el.className = html.className;
  parent.append(el);
  return el;
}

/** Lets the MutationObserver deliver its records. */
async function settle(): Promise<void> {
  await vi.advanceTimersByTimeAsync(0);
}

describe('REQ-RND-005 element marks target the first matching element (D-206)', () => {
  it('resolves the first element that matches, at once', () => {
    const first = add({ className: 'row' });
    add({ className: 'row' });
    const { resolver } = aResolver();
    resolver.watch(['.row']);
    expect(resolver.targetOf('.row')).toBe(first);
  });

  it('reports a selector that matches nothing as missing', () => {
    const { resolver } = aResolver();
    resolver.watch(['#nothing']);
    expect(resolver.targetOf('#nothing')).toBeUndefined();
  });

  it('treats an invalid selector as missing and never throws', () => {
    const { resolver } = aResolver();
    expect(() => resolver.watch(['div[', '#ok'])).not.toThrow();
    expect(resolver.targetOf('div[')).toBeUndefined();
  });

  it('knows nothing about selectors it does not watch', () => {
    add({ id: 'app' });
    const { resolver } = aResolver();
    resolver.watch([]);
    expect(resolver.targetOf('#app')).toBeUndefined();
  });
});

describe('REQ-RND-005 a debounced MutationObserver retries missing elements', () => {
  it('finds an element added later, 200 ms after the mutation', async () => {
    const { resolver, onChange } = aResolver();
    resolver.watch(['#late']);
    const late = add({ id: 'late' });
    await settle();
    await vi.advanceTimersByTimeAsync(199);
    expect(resolver.targetOf('#late')).toBeUndefined();
    await vi.advanceTimersByTimeAsync(1);
    expect(resolver.targetOf('#late')).toBe(late);
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('coalesces a burst of mutations into one retry', async () => {
    const { resolver } = aResolver();
    resolver.watch(['#late']);
    const query = vi.spyOn(document, 'querySelector');
    for (let i = 0; i < 20; i++) {
      add({ className: 'noise' });
      await vi.advanceTimersByTimeAsync(5);
    }
    await vi.advanceTimersByTimeAsync(200);
    expect(query.mock.calls.length).toBeLessThanOrEqual(1);
  });

  it('finds an element whose attributes change to match', async () => {
    const el = add({ className: 'pending' });
    const { resolver, onChange } = aResolver();
    resolver.watch(['.ready']);
    el.className = 'ready';
    await settle();
    await vi.advanceTimersByTimeAsync(200);
    expect(resolver.targetOf('.ready')).toBe(el);
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('does not query again while every element is found', async () => {
    add({ id: 'app' });
    const { resolver, onChange } = aResolver();
    resolver.watch(['#app']);
    const query = vi.spyOn(document, 'querySelector');
    add({ className: 'noise' });
    await settle();
    await vi.advanceTimersByTimeAsync(500);
    expect(query).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('calls onMutation for every batch of mutations, so the overlays re-measure', async () => {
    const onMutation = vi.fn();
    add({ id: 'app' });
    const { resolver } = aResolver(onMutation);
    resolver.watch(['#app']);
    add({ className: 'noise' });
    await settle();
    expect(onMutation).toHaveBeenCalledOnce();
  });
});

describe('REQ-RND-005 a removed target is resolved again', () => {
  it('moves to the next match when the target is removed', async () => {
    const first = add({ className: 'row' });
    const second = add({ className: 'row' });
    const { resolver, onChange } = aResolver();
    resolver.watch(['.row']);
    first.remove();
    await settle();
    expect(resolver.targetOf('.row')).toBe(second);
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('reports missing when the only match is removed, and finds it when it comes back', async () => {
    const app = add({ id: 'app' });
    const { resolver, onChange } = aResolver();
    resolver.watch(['#app']);
    app.remove();
    await settle();
    expect(resolver.targetOf('#app')).toBeUndefined();
    document.body.append(app);
    await settle();
    await vi.advanceTimersByTimeAsync(200);
    expect(resolver.targetOf('#app')).toBe(app);
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});

describe('REQ-RND-005 REQ-RND-009 the resolver observes only while it has selectors', () => {
  it('stops retrying after watch([])', async () => {
    const { resolver, onChange } = aResolver();
    resolver.watch(['#late']);
    resolver.watch([]);
    add({ id: 'late' });
    await settle();
    await vi.advanceTimersByTimeAsync(500);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('cancels a pending retry on dispose()', async () => {
    const { resolver, onChange } = aResolver();
    resolver.watch(['#late']);
    add({ id: 'late' });
    await settle();
    resolver.dispose();
    await vi.advanceTimersByTimeAsync(500);
    expect(onChange).not.toHaveBeenCalled();
    expect(resolver.targetOf('#late')).toBeUndefined();
  });
});
