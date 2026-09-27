import { useEffect, useState } from 'react';
import type { SiteMarkState } from '@/core/model/schema';
import { navigate } from './routes';

/**
 * New and duplicated site groups land at the bottom of the list (REQ-GRP-001, REQ-GRP-006). The
 * command's reply only carries the revision, so the bottom group is opened once the page shows
 * that revision. Returns the function to call with the committed revision.
 */
export function useOpenNewGroup(state: SiteMarkState): (revision: number) => void {
  const [revision, setRevision] = useState<number>();
  useEffect(() => {
    if (revision === undefined || state.revision < revision) return;
    const added = state.siteGroups.at(-1);
    if (added) navigate({ page: 'group', groupId: added.id });
    setRevision(undefined);
  }, [revision, state]);
  return setRevision;
}
