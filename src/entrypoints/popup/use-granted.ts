import { useEffect, useState } from 'react';
import type { OriginPattern } from '@/core/url/origin';
import { popupPermissions } from './popup-ports';

type Answer = { readonly key: string; readonly granted: boolean };

/**
 * Whether every origin is granted, read live from `permissions.contains` and read again on every
 * grant or revocation, never cached (REQ-PRIV-002). `undefined` until the browser answers.
 */
export function useGranted(origins: readonly OriginPattern[]): boolean | undefined {
  const key = origins.join(',');
  const [answer, setAnswer] = useState<Answer>();
  useEffect(() => {
    let isCurrent = true;
    const list = key === '' ? [] : key.split(',');
    const check = () =>
      void popupPermissions.contains(list).then((granted) => {
        if (isCurrent) setAnswer({ key, granted });
      });
    check();
    const offAdded = popupPermissions.onAdded(check);
    const offRemoved = popupPermissions.onRemoved(check);
    return () => {
      isCurrent = false;
      offAdded();
      offRemoved();
    };
  }, [key]);
  return answer?.key === key ? answer.granted : undefined;
}
