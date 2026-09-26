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

// The one place for listing URLs. T-152 fills in Chrome, Edge and Firefox once the listings are
// public; Safari follows in M9. The build's link allowlist already accepts these store domains.
const STORES: readonly Store[] = [
  { id: 'chrome', release: 'v1.0', url: null },
  { id: 'edge', release: 'v1.0', url: null },
  { id: 'firefox', release: 'v1.0', url: null },
  { id: 'safari', release: 'v1.1', url: null },
];

/** Every store, in the order the buttons show them. */
export function stores(): readonly Store[] {
  return STORES;
}

export function installState(store: Store): InstallState {
  if (store.url !== null) return 'live';
  return store.release === 'v1.0' ? 'comingSoon' : 'comingLater';
}
