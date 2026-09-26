import { createRateLimiter } from './rate-limit';

/** How often the host checks that its extension context is alive and that it is still attached. */
const CHECK_MS = 1000;
/** REQ-SEC-006: re-attaching is rate-limited to 10 per 10 s, so a hostile page can't make us spin. */
const REATTACH_MAX = 10;
const REATTACH_WINDOW_MS = 10_000;

export type HostGuardHooks = {
  readonly isAlive: () => boolean;
  /** The extension context is gone (REQ-RND-012). */
  readonly onOrphaned: () => void;
  /** The element is back on `<html>` after the page removed it. */
  readonly onReattached: () => void;
};

export type HostGuard = { stop(): void };

/**
 * Attaches `element` to `<html>` and keeps it there. Removals are repaired (rate-limited, retried
 * once the window frees up), and every mutation or tick also checks for an orphaned context: a newer
 * extension instance adding its own host is a mutation too, so an orphan leaves at once.
 */
export function guardHost(element: HTMLElement, hooks: HostGuardHooks): HostGuard {
  const limiter = createRateLimiter(REATTACH_MAX, REATTACH_WINDOW_MS, Date.now);
  let retry: ReturnType<typeof setTimeout> | undefined;
  const observer = new MutationObserver(() => check());
  const watch = (html: HTMLElement) => {
    observer.observe(document, { childList: true });
    observer.observe(html, { childList: true });
  };
  const scheduleRetry = () => {
    retry ??= setTimeout(() => {
      retry = undefined;
      check();
    }, limiter.msUntilNext());
  };
  const reattach = () => {
    const html = document.documentElement;
    if (!html || element.parentNode === html) return;
    if (!limiter.tryTake()) return scheduleRetry();
    html.append(element);
    watch(html);
    hooks.onReattached();
  };
  const check = () => (hooks.isAlive() ? reattach() : hooks.onOrphaned());

  watch(document.documentElement);
  document.documentElement.append(element);
  const timer = setInterval(check, CHECK_MS);
  return {
    stop() {
      observer.disconnect();
      clearInterval(timer);
      clearTimeout(retry);
    },
  };
}
