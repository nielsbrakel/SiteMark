import { useEffect, useState } from 'react';
import { browserStateSource, type StateSource } from './state-source';
import { newerView, type SiteMarkStateView, viewOfReply, viewOfStored } from './state-view';

/** Read-only data first (it never reaches getState's defaults), then the background's view. */
async function load(source: StateSource): Promise<SiteMarkStateView> {
  const stored = await source.readStored();
  if (stored !== undefined) {
    const view = viewOfStored(stored);
    if (view.status === 'readOnly') return view;
  }
  return viewOfReply(await source.getState());
}

/**
 * The state for the popup and options page (plan §3): the background's `getState` view on mount,
 * then every state the background stores, pushed through `storage.local.onChanged`. Everything is
 * re-validated; a page never writes (D-220) and changes things with `useCommand`.
 */
export function useSiteMarkState(source: StateSource = browserStateSource): SiteMarkStateView {
  const [view, setView] = useState<SiteMarkStateView>({ status: 'loading' });
  useEffect(() => {
    let isCurrent = true;
    const show = (next: SiteMarkStateView) => {
      if (isCurrent) setView((current) => newerView(current, next));
    };
    const unwatch = source.watch((raw) => show(viewOfStored(raw)));
    void load(source).then(show);
    return () => {
      isCurrent = false;
      unwatch();
    };
  }, [source]);
  return view;
}
