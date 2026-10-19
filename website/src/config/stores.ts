/** A browser store with SiteMark's listing (REQ-PAGE-002). */
export type Store = {
  readonly id: 'chrome' | 'edge' | 'firefox' | 'safari';
  /** The release that brings SiteMark to this store (D-253: Safari follows later). */
  readonly release: 'v1.0' | 'later';
  /** The listing, or null while it doesn't exist yet: then the button says "Coming soon". */
  readonly url: string | null;
};

/** What an install button shows: a link, "Coming soon" (v1.0) or "Coming in the future". */
export type InstallState = 'live' | 'comingSoon' | 'comingLater';

// The one place for listing URLs. Chrome, Edge and Firefox are live; Safari follows later. The build's link allowlist already accepts these store domains.
const STORES: readonly Store[] = [
  {
    id: 'chrome',
    release: 'v1.0',
    url: 'https://chrome.google.com/webstore/detail/kbpbafjebhbanajcefmkfhknbmgbndpg',
  },
  {
    id: 'edge',
    release: 'v1.0',
    url: 'https://microsoftedge.microsoft.com/addons/detail/sitemark/edfcmbpeagdkacfidejninkikjiffojn',
  },
  {
    id: 'firefox',
    release: 'v1.0',
    url: 'https://addons.mozilla.org/en-US/firefox/addon/sitemark/',
  },
  { id: 'safari', release: 'later', url: null },
];

/** Every store, in the order the buttons show them. */
export function stores(): readonly Store[] {
  return STORES;
}

export function installState(store: Store): InstallState {
  if (store.url !== null) return 'live';
  return store.release === 'v1.0' ? 'comingSoon' : 'comingLater';
}
