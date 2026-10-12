import { useEffect, useState } from 'react';
import type { Permissions } from '@/app/ports';
import type { OriginPattern } from '@/core/url/origin';

type Answer = { readonly key: string; readonly granted: boolean };

/**
 * Whether every origin is granted, read live from `permissions.contains` and read again on every
 * grant or revocation, never cached (REQ-PRIV-002). `undefined` until the browser answers.
 */
export function useGranted(
  permissions: Permissions,
  origins: readonly OriginPattern[],
): boolean | undefined {
  const key = origins.join(',');
  const [answer, setAnswer] = useState<Answer>();
  useEffect(() => {
    let isCurrent = true;
    const list = key === '' ? [] : key.split(',');
    const check = () =>
      void permissions.contains(list).then((granted) => {
        if (isCurrent) setAnswer({ key, granted });
      });
    check();
    const offAdded = permissions.onAdded(check);
    const offRemoved = permissions.onRemoved(check);
    return () => {
      isCurrent = false;
      offAdded();
      offRemoved();
    };
  }, [permissions, key]);
  return answer?.key === key ? answer.granted : undefined;
}
