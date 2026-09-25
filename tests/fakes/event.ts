import { notImplemented } from '@/core/not-implemented';

export type FakeEvent<A extends unknown[]> = {
  addListener(listener: (...args: A) => unknown): void;
  removeListener(listener: (...args: A) => unknown): void;
  hasListener(listener: (...args: A) => unknown): boolean;
  hasListeners(): boolean;
  /** Test helper: calls every listener and returns their results. */
  trigger(...args: A): unknown[];
};

export function createEvent<A extends unknown[]>(): FakeEvent<A> {
  return notImplemented();
}
