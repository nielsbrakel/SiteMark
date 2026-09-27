import { useEffect, useState } from 'react';
import { browser } from 'wxt/browser';
import type { OriginPattern } from '@/core/url/origin';

/** `undefined` until the browser answers. */
export type Granted = boolean | undefined;

async function contains(origins: readonly OriginPattern[]): Promise<boolean> {
  try {
    return await browser.permissions.contains({ origins: [...origins] });
  } catch {
    return false;
  }
}

/**
 * Whether SiteMark may run on all of `origins` (REQ-PRIV-002): read from `permissions.contains`
 * and read again on every grant or revocation, including those made in the browser's own UI.
 * Never cached beyond that.
 */
export function useGranted(origins: readonly OriginPattern[]): Granted {
  const [granted, setGranted] = useState<Granted>();
  const key = origins.join(' ');
  useEffect(() => {
    let isCurrent = true;
    const list = key.split(' ') as OriginPattern[];
    const check = () =>
      void contains(list).then((answer) => {
        if (isCurrent) setGranted(answer);
      });
    check();
    browser.permissions.onAdded.addListener(check);
    browser.permissions.onRemoved.addListener(check);
    return () => {
      isCurrent = false;
      browser.permissions.onAdded.removeListener(check);
      browser.permissions.onRemoved.removeListener(check);
    };
  }, [key]);
  return granted;
}
