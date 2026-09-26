// SPA navigation (REQ-RND-004, plan §3.3). Polling is the primary mechanism: the Navigation API
// is missing at the Firefox 140 and Safari 18 floors, and `history.pushState` fires no event.
// The events only make a change show up sooner; every signal runs the same cheap comparison.

const POLL_MS = 500;
const WINDOW_EVENTS = ['popstate', 'hashchange'] as const;

export type UrlWatch = {
  /** Stops polling and listening. */
  dispose(): void;
};

/** The Navigation API's `navigation` object where the browser has one. */
function navigationTarget(): EventTarget | undefined {
  const candidate: unknown = Reflect.get(globalThis, 'navigation');
  return candidate instanceof EventTarget ? candidate : undefined;
}

/**
 * Calls `onChange(url)` once for every change of `location.href` (REQ-RND-004), so the tab can
 * ask for a new render plan. The URL at the start is the baseline and isn't reported.
 */
export function watchUrl(onChange: (url: string) => void): UrlWatch {
  let last = location.href;
  const check = () => {
    const url = location.href;
    if (url === last) return;
    last = url;
    onChange(url);
  };
  const navigation = navigationTarget();
  const timer = setInterval(check, POLL_MS);
  for (const type of WINDOW_EVENTS) window.addEventListener(type, check);
  navigation?.addEventListener('navigatesuccess', check);
  return {
    dispose() {
      clearInterval(timer);
      for (const type of WINDOW_EVENTS) window.removeEventListener(type, check);
      navigation?.removeEventListener('navigatesuccess', check);
    },
  };
}
