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

export function createDisposer(onError: (error: unknown) => void): Disposer {
  const cleanups: (() => void)[] = [];
  let disposed = false;
  const run = (cleanup: () => void) => {
    try {
      cleanup();
    } catch (error) {
      onError(error);
    }
  };
  const add = (cleanup: () => void) => {
    if (disposed) run(cleanup);
    else cleanups.push(cleanup);
  };
  return {
    add,
    listen(target, type, listener, options) {
      target.addEventListener(type, listener, options);
      add(() => target.removeEventListener(type, listener, options));
    },
    dispose() {
      disposed = true;
      for (const cleanup of cleanups.splice(0).reverse()) run(cleanup);
    },
  };
}
