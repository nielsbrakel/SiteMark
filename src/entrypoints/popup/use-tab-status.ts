import { useCallback, useEffect, useState } from 'react';
import type { TabStatusAnswer } from '@/app/protocol';
import { sendToBackground } from '@/platform/send-message';

type Answer = { readonly key: string; readonly status: TabStatusAnswer | undefined };

export type TabStatusView = {
  /** `undefined` until the background answers, or when it doesn't. */
  readonly status: TabStatusAnswer | undefined;
  /** Asks again, e.g. after "Hide on this tab" changed it. */
  readonly refresh: () => void;
};

/**
 * What the marker in the tab reports (REQ-POP-002), asked through the background: asked again
 * when the state's revision changes, since the tab then gets a new plan.
 */
export function useTabStatus(tabId: number, revision: number): TabStatusView {
  const [asked, setAsked] = useState(0);
  const key = `${tabId}:${revision}:${asked}`;
  const [answer, setAnswer] = useState<Answer>();
  useEffect(() => {
    let isCurrent = true;
    void sendToBackground('getTabStatus', { tabId }).then((reply) => {
      if (isCurrent) setAnswer({ key, status: reply.ok ? reply.value : undefined });
    });
    return () => {
      isCurrent = false;
    };
  }, [tabId, key]);
  const refresh = useCallback(() => setAsked((count) => count + 1), []);
  // Keep showing the last answer while a new one is on its way (no flicker after a toggle).
  return { status: answer?.status, refresh };
}
