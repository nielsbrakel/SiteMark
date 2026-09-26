import { notImplemented } from '@/core/not-implemented';

/** A browser store with SiteMark's listing (REQ-PAGE-002). */
export type Store = {
  readonly id: 'chrome' | 'edge' | 'firefox' | 'safari';
  /** The release that brings SiteMark to this store (D-253: Safari follows in v1.1, M9). */
  readonly release: 'v1.0' | 'v1.1';
  /** The listing, or null while it doesn't exist yet: then the button says "Coming soon". */
  readonly url: string | null;
};

/** What an install button shows: a link, "Coming soon" (v1.0) or "Coming in v1.1". */
export type InstallState = 'live' | 'comingSoon' | 'comingLater';

/** Every store, in the order the buttons show them. */
export function stores(): readonly Store[] {
  return notImplemented();
}

export function installState(_store: Store): InstallState {
  return notImplemented();
}
