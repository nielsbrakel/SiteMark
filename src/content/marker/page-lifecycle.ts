import type { Unsubscribe } from '../../app/ports';

// Chrome runs content scripts in prerendered pages, whose frame isn't frame 0 until they are shown,
// so the background refuses their plan request; and a page restored from the back/forward cache
// missed every push while it was cached. Both need to ask for their plan at the right moment.

/** Resolves once the document is shown: at once, or when a prerendered page activates. */
export function whenShown(doc: Document = document): Promise<void> {
  if (!(doc as { prerendering?: boolean }).prerendering) return Promise.resolve();
  return new Promise((resolve) => {
    doc.addEventListener('prerenderingchange', () => resolve(), { once: true });
  });
}

/** Calls `onRestore` whenever the page comes back from the back/forward cache. */
export function onRestoredFromCache(onRestore: () => void, win: Window = window): Unsubscribe {
  const listener = (event: Event) => {
    if ((event as PageTransitionEvent).persisted) onRestore();
  };
  win.addEventListener('pageshow', listener);
  return () => win.removeEventListener('pageshow', listener);
}
