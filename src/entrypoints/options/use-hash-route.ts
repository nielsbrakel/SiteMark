import { useMemo, useSyncExternalStore } from 'react';
import { type OptionsRoute, parseOptionsRoute } from '@/core/options-route';

// The options page routes with the URL hash (REQ-OPT-001), so deep links from the popup, the picker
// and the welcome tab open the right page, and Back/Forward move between pages.

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

const currentHash = () => location.hash;

/** The route in the hash (`#/groups/:id`, …), `undefined` for none or an unknown one. */
export function useHashRoute(): OptionsRoute | undefined {
  const hash = useSyncExternalStore(subscribe, currentHash);
  return useMemo(() => parseOptionsRoute(hash.replace(/^#/, '')), [hash]);
}
