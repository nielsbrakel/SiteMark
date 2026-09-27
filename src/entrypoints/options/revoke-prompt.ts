import { createContext, useContext } from 'react';
import { browser } from 'wxt/browser';
import { unusedOrigins } from '@/app/use-cases/unused-origins';
import { t, tp } from '@/lib/i18n/browser-source';
import { sendToBackground } from '@/platform/send-message';
import { type Notify, UNDO_MS } from './notify';

/** Offers to revoke the granted origins nothing uses any more, if there are any (REQ-PRIV-004). */
export type OfferRevoke = () => void;

async function offer(notify: Notify): Promise<void> {
  // The background's state, not the page's: the page may not have seen the removal yet.
  const reply = await sendToBackground('getState');
  if (!reply.ok) return;
  const { origins: granted = [] } = await browser.permissions.getAll();
  const unused = unusedOrigins(reply.value, granted);
  if (unused.length === 0) return;
  notify({
    text: tp('optionsUnusedOrigins', unused.length),
    action: {
      label: t('optionsRemoveAccess'),
      onAction: () => void browser.permissions.remove({ origins: unused }),
    },
    durationMs: UNDO_MS,
  });
}

/** The page's revoke offer, shown as a toast with Remove access. */
export function createOfferRevoke(notify: Notify): OfferRevoke {
  return () => void offer(notify).catch(() => undefined);
}

/** Provided by the options layout; a no-op outside it. */
export const RevokeContext = createContext<OfferRevoke>(() => undefined);

export function useOfferRevoke(): OfferRevoke {
  return useContext(RevokeContext);
}
