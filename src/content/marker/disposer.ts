import { notImplemented } from '../../core/not-implemented';

/** Collects the clean-ups of one owner (a view, the renderer) and runs them together. */
export type Disposer = {
  /** Runs `cleanup` on dispose(), or at once when already disposed. */
  add(cleanup: () => void): void;
  /** Adds an event listener that dispose() removes again. */
  listen(
    target: EventTarget,
    type: string,
    listener: EventListener,
    options?: AddEventListenerOptions,
  ): void;
  /** Runs every clean-up once, newest first; one that throws doesn't stop the others. */
  dispose(): void;
};

export function createDisposer(_onError: (error: unknown) => void): Disposer {
  return notImplemented();
}
