import { useEffect, useState } from 'react';
import { browserStateSource, type StateSource } from '@/ui/hooks/state-source';
import { viewOfStored } from '@/ui/hooks/state-view';

const isUnreadable = (raw: unknown): boolean => {
  if (raw === undefined) return false;
  const view = viewOfStored(raw);
  return view.status === 'error' && view.error === 'stateUnreadable';
};

/**
 * Whether the stored data can't be read (D-264). The background then answers with the defaults
 * until its next save replaces the data (a backup is kept), so the popup keeps working and only
 * says so. Follows every stored value.
 */
export function useStoredUnreadable(source: StateSource = browserStateSource): boolean {
  const [unreadable, setUnreadable] = useState(false);
  useEffect(() => {
    let isCurrent = true;
    const check = (raw: unknown) => {
      if (isCurrent) setUnreadable(isUnreadable(raw));
    };
    const unwatch = source.watch(check);
    void source.readStored().then(check);
    return () => {
      isCurrent = false;
      unwatch();
    };
  }, [source]);
  return unreadable;
}
