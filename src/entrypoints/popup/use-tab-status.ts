import { useEffect, useState } from 'react';
import type { TabStatusAnswer } from '@/app/protocol';
import { sendToBackground } from '@/platform/send-message';

type Answer = { readonly key: string; readonly status: TabStatusAnswer | undefined };

/**
 * What the marker in the tab reports (REQ-POP-002), asked through the background: asked again
 * when the state's revision changes, since the tab then gets a new plan. `undefined` until the
 * background answers, or when it doesn't.
 */
export function useTabStatus(tabId: number, revision: number): TabStatusAnswer | undefined {
  const key = `${tabId}:${revision}`;
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
  return answer?.status;
}
