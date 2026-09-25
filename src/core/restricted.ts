/** Extension stores, where every browser blocks extensions. `path` limits a host to one section. */
const STORE_PAGES: readonly { readonly host: string; readonly path?: string }[] = [
  { host: 'chromewebstore.google.com' },
  { host: 'chrome.google.com', path: '/webstore' },
  { host: 'microsoftedge.microsoft.com', path: '/addons' },
  { host: 'addons.mozilla.org' },
];

/** `http(s)://` + authority (group 1) + path (group 2). Anything else is not a web page. */
const WEB_URL = /^https?:\/\/([^/?#]*)([^?#]*)/i;

/**
 * Whether `url` is a page where the browser won't let SiteMark run: anything that isn't http(s)
 * (browser pages, other extensions, `file:`, `view-source:`, `data:`), the extension stores, and PDFs
 * that open in the built-in viewer (REQ-POP-005, REQ-ENV-003). Only a hint for the popup: a failed
 * `scripting.executeScript` is the ground truth. Pure string parsing, since core has no `URL` global.
 */
export function isKnownRestrictedUrl(url: string): boolean {
  const match = WEB_URL.exec(url);
  if (match === null) return true;
  const host = hostOf(match[1] ?? '');
  const path = match[2] ?? '';
  return isStorePage(host, path) || /\.pdf$/i.test(path);
}

/** The lower-cased host of an authority, without user info, port or a trailing dot. */
function hostOf(authority: string): string {
  const hostAndPort = authority.slice(authority.lastIndexOf('@') + 1);
  const host = hostAndPort.startsWith('[')
    ? hostAndPort.slice(0, hostAndPort.indexOf(']') + 1)
    : (hostAndPort.split(':')[0] ?? '');
  return host.toLowerCase().replace(/\.$/, '');
}

function isStorePage(host: string, path: string): boolean {
  return STORE_PAGES.some(
    (store) =>
      store.host === host &&
      (store.path === undefined || path === store.path || path.startsWith(`${store.path}/`)),
  );
}
