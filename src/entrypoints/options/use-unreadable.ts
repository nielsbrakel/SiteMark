import { useEffect, useState } from 'react';
import { browserStateSource, type StateSource } from '@/ui/hooks/state-source';
import { viewOfStored } from '@/ui/hooks/state-view';

/**
 * Whether the stored data can't be read (REQ-DATA-001). The background then works with defaults and
 * `getState` looks healthy, so the page checks the raw stored value itself (reading is allowed,
 * D-271) until a save replaces it.
 */
export function useUnreadable(source: StateSource = browserStateSource): boolean {
  const [isUnreadable, setUnreadable] = useState(false);
  useEffect(() => {
    let isCurrent = true;
    const check = (raw: unknown) => {
      if (isCurrent) setUnreadable(raw !== undefined && viewOfStored(raw).status === 'error');
    };
    const unwatch = source.watch(check);
    void source.readStored().then(check);
    return () => {
      isCurrent = false;
      unwatch();
    };
  }, [source]);
  return isUnreadable;
}
