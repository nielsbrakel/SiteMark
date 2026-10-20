/** A browser store with SiteMark's listing (REQ-PAGE-002). */
export type Store = {
  readonly id: 'chrome' | 'edge' | 'firefox' | 'safari';
  /** The listing, or null while it doesn't exist yet: then the button says "Coming in the future". */
  readonly url: string | null;
};

// The one place for listing URLs. Chrome, Edge and Firefox are live; Safari follows later. The build's link allowlist already accepts these store domains.
const STORES: readonly Store[] = [
  {
    id: 'chrome',
    url: 'https://chrome.google.com/webstore/detail/kbpbafjebhbanajcefmkfhknbmgbndpg',
  },
  {
    id: 'edge',
    url: 'https://microsoftedge.microsoft.com/addons/detail/sitemark/edfcmbpeagdkacfidejninkikjiffojn',
  },
  {
    id: 'firefox',
    url: 'https://addons.mozilla.org/en-US/firefox/addon/sitemark/',
  },
  { id: 'safari', url: null },
];

/** Every store, in the order the buttons show them. */
export function stores(): readonly Store[] {
  return STORES;
}
