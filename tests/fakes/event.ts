export type FakeEvent<A extends unknown[]> = {
  addListener(listener: (...args: A) => unknown): void;
  removeListener(listener: (...args: A) => unknown): void;
  hasListener(listener: (...args: A) => unknown): boolean;
  hasListeners(): boolean;
  /** Test helper: calls every listener and returns their results. */
  trigger(...args: A): unknown[];
};

export function createEvent<A extends unknown[]>(): FakeEvent<A> {
  const listeners = new Set<(...args: A) => unknown>();
  return {
    addListener: (listener) => void listeners.add(listener),
    removeListener: (listener) => void listeners.delete(listener),
    hasListener: (listener) => listeners.has(listener),
    hasListeners: () => listeners.size > 0,
    trigger: (...args) => [...listeners].map((listener) => listener(...args)),
  };
}
